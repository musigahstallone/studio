
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, serverTimestamp, doc, runTransaction, query, where, addDoc } from 'firebase/firestore';
import type { Expense, PlatformRevenueEntry } from '@/lib/types'; // Added PlatformRevenueEntry
// import { auth } from '@/lib/firebase'; // Not needed for this specific action if admin role is checked client-side or via rules

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
            totalPlatformRevenue += doc.data().amount; // Amount is positive for income, negative for payout
        });

        if (amountToWithdrawBase > totalPlatformRevenue) {
            return { error: `Insufficient platform revenue. Available: ${totalPlatformRevenue.toFixed(2)} USD.` };
        }

        await runTransaction(db, async (transaction) => {
            const transactionTimestamp = serverTimestamp();
            const transactionDate = new Date().toISOString().split('T')[0];

            // 1. Create Income for Admin
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
            // Also add to expenses_all for admin's income
            transaction.set(doc(db, 'expenses_all', adminIncomeRef.id), { ...adminIncomeData, id: adminIncomeRef.id });

            // 2. Record Payout from Platform Revenue (as a negative entry)
            const payoutRevenueRef = doc(collection(db, 'platformRevenue'));
            const payoutRevenueData: Omit<PlatformRevenueEntry, 'id'> = {
                userId: adminUid, 
                type: 'payout',
                amount: -amountToWithdrawBase, // Negative amount
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
