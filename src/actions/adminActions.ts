
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, serverTimestamp, doc, runTransaction, query, where, addDoc } from 'firebase/firestore';
import type { Expense, PlatformRevenueEntry } from '@/lib/types'; 
import { generateTransactionTag } from '@/lib/types'; // Import the tag generator

export async function markAllUsersActive(): Promise<{ title: string; description: string }> {
  try {
    const usersColRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersColRef);
    
    if (usersSnapshot.empty) {
      return {
        title: "No Users Found",
        description: "There are no user documents in the database to update.",
      };
    }

    const batch = writeBatch(db);
    let usersUpdatedCount = 0;

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (!userData.isDeletedAccount && userData.isActive !== true) {
        batch.update(userDoc.ref, {
          isActive: true,
          updatedAt: serverTimestamp(),
        });
        usersUpdatedCount++;
      }
    });

    if (usersUpdatedCount > 0) {
      await batch.commit();
      return {
        title: "Users Updated",
        description: `${usersUpdatedCount} user(s) marked as active.`,
      };
    } else {
      return {
        title: "No Users to Update",
        description: "All non-deleted users are already active or no users required an update.",
      };
    }
  } catch (error: any) {
    console.error("Error marking all users active:", error);
    throw new Error(`Failed to mark users as active. ${error.message || 'Unknown error occurred.'}`);
  }
}


interface WithdrawRevenueResult {
    success?: boolean;
    message?: string;
    error?: string;
}

export async function withdrawPlatformRevenueToAdmin(
    adminUid: string,
    amountToWithdrawBase: number,
    description: string
): Promise<WithdrawRevenueResult> {
    if (!adminUid) return { error: "Admin UID not provided." };
    if (amountToWithdrawBase <= 0) return { error: "Withdrawal amount must be positive." };

    try {
        let totalPlatformRevenue = 0;
        const revenueSnapshot = await getDocs(collection(db, 'platformRevenue'));
        revenueSnapshot.forEach(doc => {
            totalPlatformRevenue += doc.data().amount; 
        });

        if (amountToWithdrawBase > totalPlatformRevenue) {
            return { error: `Insufficient platform revenue. Available: ${totalPlatformRevenue.toFixed(2)} USD.` };
        }

        await runTransaction(db, async (transaction) => {
            const transactionTimestamp = serverTimestamp();
            const transactionDate = new Date().toISOString().split('T')[0];

            const adminIncomeRef = doc(collection(db, 'users', adminUid, 'expenses'));
            const adminIncomeData: Omit<Expense, 'id'> = {
                userId: adminUid,
                description: description || `Platform Revenue Withdrawal`,
                amount: amountToWithdrawBase,
                date: transactionDate,
                category: 'Platform Payout',
                type: 'income',
                createdAt: transactionTimestamp,
                updatedAt: transactionTimestamp,
            };
            transaction.set(adminIncomeRef, adminIncomeData);
            transaction.set(doc(db, 'expenses_all', adminIncomeRef.id), { ...adminIncomeData, id: adminIncomeRef.id });

            const payoutRevenueRef = doc(collection(db, 'platformRevenue'));
            const payoutRevenueData: Omit<PlatformRevenueEntry, 'id'> = {
                userId: adminUid, 
                type: 'payout',
                amount: -amountToWithdrawBase, 
                description: description || `Platform Revenue Withdrawal to Admin`,
                date: transactionDate,
                createdAt: transactionTimestamp,
            };
            transaction.set(payoutRevenueRef, payoutRevenueData);
        });

        return { success: true, message: `Successfully withdrew ${amountToWithdrawBase.toFixed(2)} USD from platform revenue.` };

    } catch (error: any) {
        console.error("Error withdrawing platform revenue:", error);
        return { error: `Failed to withdraw revenue. ${error.message || 'Unknown error occurred.'}` };
    }
}

export async function assignMissingTransactionTagsToUsers(): Promise<{ title: string; description: string }> {
  try {
    const usersColRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersColRef);

    if (usersSnapshot.empty) {
      return { title: "No Users Found", description: "There are no users in the database." };
    }

    const batch = writeBatch(db);
    let usersUpdatedCount = 0;
    const existingTags = new Set<string>();
    usersSnapshot.forEach(doc => {
        const tag = doc.data().transactionTag;
        if (tag) existingTags.add(tag);
    });


    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (!userData.transactionTag || userData.transactionTag.trim() === "") {
        let uniqueTag = '';
        let tagIsUniqueInDbAndBatch = false;
        let attempts = 0;
        const maxAttempts = 20; // Prevent infinite loop in unlikely scenario

        while (!tagIsUniqueInDbAndBatch && attempts < maxAttempts) {
          uniqueTag = generateTransactionTag();
          
          // Check against current Firestore data (less critical if we assume generateTransactionTag is good enough for a few items)
          // This is more robust:
          const q = query(usersColRef, where('transactionTag', '==', uniqueTag));
          const querySnapshot = await getDocs(q); // Needs await inside loop
          
          if (querySnapshot.empty && !existingTags.has(uniqueTag)) {
            tagIsUniqueInDbAndBatch = true;
          }
          attempts++;
        }
        
        if (tagIsUniqueInDbAndBatch) {
          batch.update(userDoc.ref, {
            transactionTag: uniqueTag,
            updatedAt: serverTimestamp(),
          });
          existingTags.add(uniqueTag); // Add to set for checks within this batch run
          usersUpdatedCount++;
        } else {
            console.warn(`Could not generate a unique tag for user ${userDoc.id} after ${maxAttempts} attempts.`);
        }
      }
    }

    if (usersUpdatedCount > 0) {
      await batch.commit();
      return {
        title: "Transaction Tags Assigned",
        description: `${usersUpdatedCount} user(s) have been assigned a new transaction tag.`,
      };
    } else {
      return {
        title: "No Updates Needed",
        description: "All users already have a transaction tag or no users found.",
      };
    }
  } catch (error: any) {
    console.error("Error assigning transaction tags:", error);
    throw new Error(`Failed to assign transaction tags. ${error.message || 'Unknown error occurred.'}`);
  }
}
