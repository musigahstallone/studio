
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { AppUser, Expense, CurrencyCode, PlatformRevenueEntry } from '@/lib/types';
import { DEFAULT_STORED_CURRENCY } from '@/lib/types';
import { convertToBaseCurrency, calculateTransactionCost, formatCurrency } from '@/lib/utils'; // Assuming calculateTransactionCost is in utils

interface VerificationResult {
  recipientName?: string;
  recipientUid?: string;
  error?: string;
}

export async function verifyRecipientByTransactionTag(tag: string): Promise<VerificationResult> {
  if (!tag || tag.trim() === "") {
    return { error: "Transaction Tag cannot be empty." };
  }
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('transactionTag', '==', tag.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { error: "No user found with this Transaction Tag." };
    }
    if (querySnapshot.size > 1) {
      // This should ideally not happen if tags are unique.
      console.warn(`Multiple users found for transactionTag: ${tag}. Using the first one.`);
    }
    const recipientDoc = querySnapshot.docs[0];
    const recipientData = recipientDoc.data() as AppUser;
    return { recipientName: recipientData.name || recipientData.email?.split('@')[0] || "User", recipientUid: recipientDoc.id };
  } catch (error: any) {
    console.error("Error verifying recipient by transaction tag:", error);
    return { error: `Failed to verify recipient. ${error.message || 'Unknown error.'}` };
  }
}


interface SendMoneyResult {
  success?: boolean;
  message?: string;
  error?: string;
  transactionId?: string; // ID of the sender's expense transaction
}

export async function sendMoneyP2P(
  senderUid: string,
  recipientTag: string,
  amountInSenderLocalCurrency: number,
  senderLocalCurrency: CurrencyCode,
  description?: string
): Promise<SendMoneyResult> {
  if (!senderUid) return { error: "Sender not authenticated." };
  if (!recipientTag) return { error: "Recipient Transaction Tag is required." };
  if (amountInSenderLocalCurrency <= 0) return { error: "Amount must be positive." };

  const amountToSendBase = convertToBaseCurrency(amountInSenderLocalCurrency, senderLocalCurrency);
  const transactionCostBase = calculateTransactionCost(amountToSendBase); 

  if (transactionCostBase < 0) { 
      return { error: "Invalid transaction cost calculated."};
  }

  const totalDeductionFromSenderBase = amountToSendBase + transactionCostBase;

  try {
    let finalMessage = "";

    await runTransaction(db, async (transaction) => {
      // 1. Get Recipient
      const usersRef = collection(db, 'users');
      const recipientQuery = query(usersRef, where('transactionTag', '==', recipientTag.trim()));
      const recipientSnapshot = await getDocs(recipientQuery); 

      if (recipientSnapshot.empty) {
        throw new Error("Recipient not found with the provided Transaction Tag.");
      }
      const recipientDoc = recipientSnapshot.docs[0];
      const recipient = recipientDoc.data() as AppUser;
      const recipientUid = recipientDoc.id;

      if (senderUid === recipientUid) {
        throw new Error("Cannot send money to yourself.");
      }

      // 2. Get Sender
      const senderDocRef = doc(db, 'users', senderUid);
      const senderDoc = await transaction.get(senderDocRef);
      if (!senderDoc.exists()) {
        throw new Error("Sender account not found.");
      }
      const sender = senderDoc.data() as AppUser;
      
      // 3. Check Sender's Balance (Simplified - Sum of all income minus sum of all expenses)
      const expensesColRef = collection(db, 'users', senderUid, 'expenses');
      const expensesSnapshot = await getDocs(query(expensesColRef)); 
      
      let totalIncome = 0;
      let totalExpenses = 0;
      expensesSnapshot.forEach(doc => {
        const expense = doc.data() as Expense;
        if (expense.type === 'income') totalIncome += expense.amount;
        else totalExpenses += expense.amount;
      });
      const senderBalanceBase = totalIncome - totalExpenses;

      if (senderBalanceBase < totalDeductionFromSenderBase) {
         // Convert totalDeductionFromSenderBase back to sender's local currency for the error message
        const rateFromBaseToLocal = 1 / (convertToBaseCurrency(1, senderLocalCurrency) || 1);
        const neededInLocal = totalDeductionFromSenderBase * rateFromBaseToLocal;
        throw new Error(`Insufficient funds. You need at least ${neededInLocal.toFixed(2)} ${senderLocalCurrency} (includes fee of ${(transactionCostBase * rateFromBaseToLocal).toFixed(2)} ${senderLocalCurrency}).`);
      }

      const transactionTimestamp = serverTimestamp();
      const transactionDate = new Date().toISOString().split('T')[0];

      // 4. Create Expense for Sender (Amount is now totalDeductionFromSenderBase)
      const senderExpenseRef = doc(collection(db, 'users', senderUid, 'expenses'));
      let senderDescription = description ? `Sent to ${recipient.name || recipientTag}: ${description}` : `Sent to ${recipient.name || recipientTag}`;
      if (transactionCostBase > 0) {
        senderDescription += ` (Fee: ${formatCurrency(transactionCostBase, DEFAULT_STORED_CURRENCY)})`;
      }
      
      const senderExpenseData: Omit<Expense, 'id'> = {
        userId: senderUid,
        description: senderDescription,
        amount: totalDeductionFromSenderBase, // Sender's expense includes amount sent + fee
        date: transactionDate,
        category: 'P2P Transfer',
        type: 'expense',
        p2pRecipientTag: recipientTag,
        createdAt: transactionTimestamp,
        updatedAt: transactionTimestamp,
      };
      transaction.set(senderExpenseRef, senderExpenseData);
      transaction.set(doc(db, 'expenses_all', senderExpenseRef.id), { ...senderExpenseData, id: senderExpenseRef.id });


      // 5. Create Income for Recipient (Recipient gets amountToSendBase)
      const recipientIncomeRef = doc(collection(db, 'users', recipientUid, 'expenses'));
      const recipientIncomeData: Omit<Expense, 'id'> = {
        userId: recipientUid,
        description: description ? `Received from ${sender.name || senderUid.substring(0,5)}: ${description}` : `Received from ${sender.name || senderUid.substring(0,5)}`,
        amount: amountToSendBase, // Recipient gets the original amount, fee is separate
        date: transactionDate,
        category: 'P2P Transfer',
        type: 'income',
        p2pSenderName: sender.name || senderUid.substring(0,5), 
        createdAt: transactionTimestamp,
        updatedAt: transactionTimestamp,
      };
      transaction.set(recipientIncomeRef, recipientIncomeData);
      transaction.set(doc(db, 'expenses_all', recipientIncomeRef.id), { ...recipientIncomeData, id: recipientIncomeRef.id });


      // 6. Record Transaction Fee as Platform Revenue
      if (transactionCostBase > 0) {
        const revenueRef = doc(collection(db, 'platformRevenue'));
        const revenueData: Omit<PlatformRevenueEntry, 'id'> = {
          userId: senderUid, 
          relatedP2PTransactionId: senderExpenseRef.id, 
          type: 'transaction_fee',
          amount: transactionCostBase,
          description: `P2P transfer fee: ${sender.name || senderUid.substring(0,5)} to ${recipient.name || recipientTag}`,
          date: transactionDate,
          createdAt: transactionTimestamp,
        };
        transaction.set(revenueRef, revenueData);
      }
      finalMessage = `Successfully sent ${formatCurrency(amountToSendBase, DEFAULT_STORED_CURRENCY)} to ${recipient.name || recipientTag}. Total debited: ${formatCurrency(totalDeductionFromSenderBase, DEFAULT_STORED_CURRENCY)}.`;
    });

    return { success: true, message: finalMessage };

  } catch (error: any) {
    console.error("Error sending P2P money:", error);
    return { error: `Failed to send money. ${error.message || 'Unknown error.'}` };
  }
}
