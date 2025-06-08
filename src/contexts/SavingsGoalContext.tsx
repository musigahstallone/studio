
"use client";

import type { SavingsGoal, Expense, SavingsGoalContribution, SavingsGoalWithdrawal, PlatformRevenueEntry } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase'; // storage removed as not used here
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  orderBy,
  Timestamp,
  writeBatch,
  getDocs,
  runTransaction,
} from 'firebase/firestore';
// deleteObject, ref removed as not used here
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useExpenses } from './ExpenseContext'; // To calculate available income

interface SavingsGoalContextType {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string | undefined>;
  updateSavingsGoal: (updatedGoalData: Omit<SavingsGoal, 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'> & { id: string }) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  contributeToGoal: (goalId: string, amountInBaseCurrency: number, contributionDescription?: string) => Promise<void>;
  withdrawFromGoal: (
    goal: SavingsGoal,
    withdrawalAmountInBaseCurrency: number, // The full amount intended to be withdrawn from the goal
    description?: string
  ) => Promise<void>;
  loadingSavingsGoals: boolean;
}

const SavingsGoalContext = createContext<SavingsGoalContextType | undefined>(undefined);

export const SavingsGoalProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { expenses: userExpenses } = useExpenses(); // For spendable income calculation
  const { toast } = useToast();

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loadingSavingsGoals, setLoadingSavingsGoals] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoadingSavingsGoals(true);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    if (user?.uid) {
      setLoadingSavingsGoals(true);
      const goalsCol = collection(db, 'users', user.uid, 'savingsGoals');
      const q = query(goalsCol, orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const goalsFromDb: SavingsGoal[] = [];
        querySnapshot.forEach((docSnapshot) => { // Renamed doc to docSnapshot to avoid conflict
          const data = docSnapshot.data();
          goalsFromDb.push({
            id: docSnapshot.id,
            userId: data.userId,
            name: data.name,
            targetAmount: data.targetAmount,
            currentAmount: data.currentAmount,
            targetDate: data.targetDate,
            startDate: data.startDate,
            durationMonths: data.durationMonths,
            allowsEarlyWithdrawal: data.allowsEarlyWithdrawal,
            earlyWithdrawalPenaltyRate: data.earlyWithdrawalPenaltyRate,
            status: data.status || 'active',
            withdrawalCondition: data.withdrawalCondition || 'maturityDateReached',
            createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
            updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
          } as SavingsGoal);
        });
        setSavingsGoals(goalsFromDb);
        setLoadingSavingsGoals(false);
      }, (error) => {
        console.error("Error fetching savings goals: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your savings goals." });
        setLoadingSavingsGoals(false);
      });
    } else {
      setSavingsGoals([]);
      setLoadingSavingsGoals(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading, toast]);

  const addSavingsGoal = useCallback(async (
    goalData: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string | undefined> => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to add a savings goal." });
      return undefined;
    }
    const newGoalPayload = {
      ...goalData,
      userId: user.uid,
      currentAmount: 0,
      status: 'active' as SavingsGoalStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const userGoalsCol = collection(db, 'users', user.uid, 'savingsGoals');
      const docRef = await addDoc(userGoalsCol, newGoalPayload);
      toast({ title: "Savings Goal Created", description: `Goal "${goalData.name}" set.` });
      return docRef.id;
    } catch (e) {
      console.error("Error adding savings goal: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not create savings goal." });
      return undefined;
    }
  }, [user, toast]);

  const updateSavingsGoal = useCallback(async (
    updatedGoalData: Omit<SavingsGoal, 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'> & { id: string }
  ) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to update a goal." });
      return;
    }
    const { id, ...dataToUpdate } = updatedGoalData;
    const goalPayload = {
      ...dataToUpdate,
      // userId: user.uid, // Not needed as we are updating existing doc for user
      updatedAt: serverTimestamp(),
    };
    try {
      const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', id);
      await updateDoc(goalDocRef, goalPayload);
      toast({ title: "Savings Goal Updated", description: `Goal "${updatedGoalData.name}" updated.` });
    } catch (e) {
      console.error("Error updating savings goal: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not update savings goal." });
    }
  }, [user, toast]);

  const deleteSavingsGoal = useCallback(async (goalId: string) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    try {
      const batch = writeBatch(db);
      const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goalId);
      batch.delete(goalDocRef);

      const contributionsQuery = query(
        collection(db, 'users', user.uid, 'savingsGoalContributions'),
        where('savingsGoalId', '==', goalId)
      );
      const contributionsSnapshot = await getDocs(contributionsQuery);
      contributionsSnapshot.forEach((contributionDoc) => {
        batch.delete(contributionDoc.ref);
        const expenseId = contributionDoc.data().expenseId;
        if (expenseId) {
          const expenseDocRef = doc(db, 'users', user.uid, 'expenses', expenseId);
          batch.delete(expenseDocRef);
        }
      });
      
      // Also delete related withdrawals and their income transactions (if any)
      const withdrawalsQuery = query(
        collection(db, 'users', user.uid, 'savingsGoalWithdrawals'),
        where('savingsGoalId', '==', goalId)
      );
      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      withdrawalsSnapshot.forEach((withdrawalDoc) => {
        batch.delete(withdrawalDoc.ref);
        const incomeTxId = withdrawalDoc.data().incomeTransactionId;
        if (incomeTxId) {
            const incomeTxRef = doc(db, 'users', user.uid, 'expenses', incomeTxId);
            batch.delete(incomeTxRef);
        }
      });


      await batch.commit();
      toast({ title: "Savings Goal Deleted", description: "Goal and related records removed." });
    } catch (e) {
      console.error("Error deleting savings goal: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not delete goal." });
    }
  }, [user, toast]);

  const contributeToGoal = useCallback(async (
    goalId: string,
    amountInBaseCurrency: number,
    contributionDescription?: string
  ) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      throw new Error("Not Authenticated");
    }
    if (amountInBaseCurrency <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Contribution must be positive." });
      throw new Error("Invalid Amount");
    }

    const totalIncome = userExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCurrentSavingsContributions = userExpenses
      .filter(e => e.category === 'Savings')
      .reduce((sum, e) => sum + e.amount, 0);
    const spendableIncome = totalIncome - totalCurrentSavingsContributions;

    if (amountInBaseCurrency > spendableIncome) {
      toast({ variant: "destructive", title: "Insufficient Income", description: "Not enough spendable income to make this contribution." });
      throw new Error("Insufficient spendable income to make this contribution.");
    }

    const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goalId);
    const expenseColRef = collection(db, 'users', user.uid, 'expenses');
    const contributionColRef = collection(db, 'users', user.uid, 'savingsGoalContributions');
    let expenseIdToLink = '';

    try {
      await runTransaction(db, async (transaction) => {
        const goalSnap = await transaction.get(goalDocRef);
        if (!goalSnap.exists()) throw new Error("Savings goal not found.");
        
        const goalData = goalSnap.data() as SavingsGoal;
        if (goalData.status !== 'active') throw new Error(`Goal "${goalData.name}" is not active.`);
        if (goalData.currentAmount >= goalData.targetAmount) throw new Error("Goal already achieved.");

        const newCurrentAmount = goalData.currentAmount + amountInBaseCurrency;
        const actualContribution = newCurrentAmount > goalData.targetAmount
          ? amountInBaseCurrency - (newCurrentAmount - goalData.targetAmount)
          : amountInBaseCurrency;

        if (actualContribution <= 0) throw new Error("Contribution too small to process.");

        const expensePayload: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          description: contributionDescription || `Contribution to ${goalData.name}`,
          amount: actualContribution,
          date: new Date().toISOString().split('T')[0],
          category: 'Savings',
          type: 'expense',
          merchant: 'Savings Goal Contribution',
          receiptUrl: null,
          relatedSavingsGoalId: goalId,
        };
        
        // Generate a new doc ref for expense to get its ID before setting it.
        const newExpenseDocRef = doc(expenseColRef); 
        expenseIdToLink = newExpenseDocRef.id; // Capture ID for contribution link

        transaction.set(newExpenseDocRef, {
          ...expensePayload,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        transaction.update(goalDocRef, {
          currentAmount: Math.min(newCurrentAmount, goalData.targetAmount),
          updatedAt: serverTimestamp(),
          status: Math.min(newCurrentAmount, goalData.targetAmount) >= goalData.targetAmount && goalData.withdrawalCondition === 'targetAmountReached' ? 'matured' : goalData.status,
        });
      });

      // After successful transaction, create the contribution link record
      if (expenseIdToLink) {
         await addDoc(contributionColRef, {
            userId: user.uid,
            savingsGoalId: goalId,
            expenseId: expenseIdToLink,
            amount: amountInBaseCurrency, // Log the intended contribution
            date: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp(),
        });
      } else {
          throw new Error("Failed to get new expense ID for contribution linking.");
      }

      toast({ title: "Contribution Successful" });
    } catch (e) {
      console.error("Error contributing to savings goal: ", e);
      const errorMessage = e instanceof Error ? e.message : "Could not process contribution.";
       if (errorMessage !== "Insufficient spendable income to make this contribution." && errorMessage !== "Goal already achieved." && errorMessage !== "Contribution too small to process.") {
        toast({ variant: "destructive", title: "Contribution Failed", description: errorMessage });
      }
      throw e; // Re-throw to be caught by form
    }
  }, [user, userExpenses, toast]);

  const withdrawFromGoal = useCallback(async (
    goal: SavingsGoal,
    withdrawalAmountInBaseCurrency: number, // This is the amount intended to be taken from the goal
    description?: string
  ) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      throw new Error("Not Authenticated");
    }
    if (withdrawalAmountInBaseCurrency <= 0 || withdrawalAmountInBaseCurrency > goal.currentAmount) {
      toast({ variant: "destructive", title: "Invalid Withdrawal Amount" });
      throw new Error("Invalid withdrawal amount.");
    }

    const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
    const expenseColRef = collection(db, 'users', user.uid, 'expenses');
    const withdrawalLogColRef = collection(db, 'users', user.uid, 'savingsGoalWithdrawals');
    const platformRevenueColRef = collection(db, 'platformRevenue'); // Global collection

    let isEarly = false;
    if (goal.targetDate) {
        isEarly = new Date() < new Date(goal.targetDate);
    } else if (goal.startDate && goal.durationMonths) {
        const sDate = new Date(goal.startDate);
        const mDate = new Date(sDate.setMonth(sDate.getMonth() + goal.durationMonths));
        isEarly = new Date() < mDate;
    }
    
    let penaltyAmount = 0;
    if (isEarly && goal.allowsEarlyWithdrawal && goal.earlyWithdrawalPenaltyRate > 0) {
      penaltyAmount = withdrawalAmountInBaseCurrency * goal.earlyWithdrawalPenaltyRate;
    } else if (isEarly && !goal.allowsEarlyWithdrawal) {
      toast({ variant: "destructive", title: "Early Withdrawal Not Allowed" });
      throw new Error("Early withdrawal is not allowed for this goal.");
    }

    const netAmountToUser = withdrawalAmountInBaseCurrency - penaltyAmount;
    let incomeTransactionId = '';

    try {
      await runTransaction(db, async (transaction) => {
        const goalSnap = await transaction.get(goalDocRef);
        if (!goalSnap.exists()) throw new Error("Savings goal not found.");
        const currentGoalData = goalSnap.data() as SavingsGoal;
        if (currentGoalData.currentAmount < withdrawalAmountInBaseCurrency) throw new Error("Insufficient funds in goal.");

        const newGoalCurrentAmount = currentGoalData.currentAmount - withdrawalAmountInBaseCurrency;
        let newGoalStatus = currentGoalData.status;
        if (isEarly) newGoalStatus = 'withdrawnEarly';
        else if (newGoalCurrentAmount === 0 && currentGoalData.currentAmount >= currentGoalData.targetAmount) newGoalStatus = 'completed';
        else if (newGoalCurrentAmount === 0) newGoalStatus = 'active'; // Or 'cancelled' if it implies a choice

        transaction.update(goalDocRef, {
          currentAmount: newGoalCurrentAmount,
          status: newGoalStatus,
          updatedAt: serverTimestamp(),
        });

        // Create Income Transaction for User
        const incomePayload: Omit<Expense, 'id'|'userId'|'createdAt'|'updatedAt'> = {
            description: description || `Withdrawal from ${goal.name}`,
            amount: netAmountToUser,
            date: new Date().toISOString().split('T')[0],
            category: 'Savings Withdrawal',
            type: 'income',
            relatedSavingsGoalId: goal.id,
        };
        const newIncomeDocRef = doc(expenseColRef);
        incomeTransactionId = newIncomeDocRef.id;
        transaction.set(newIncomeDocRef, { ...incomePayload, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

        // Create Platform Revenue Entry (if penalty)
        if (penaltyAmount > 0) {
            const revenuePayload: Omit<PlatformRevenueEntry, 'id'|'createdAt'> = {
                userId: user.uid,
                relatedGoalId: goal.id,
                type: 'penalty',
                amount: penaltyAmount,
                description: `Early withdrawal penalty from goal: ${goal.name}`,
                date: new Date().toISOString().split('T')[0],
            };
            const newRevenueDocRef = doc(platformRevenueColRef);
            transaction.set(newRevenueDocRef, {...revenuePayload, createdAt: serverTimestamp()});
        }
      });

      // Log the withdrawal (outside transaction for simplicity with generated incomeTxId)
       if (incomeTransactionId) {
            await addDoc(withdrawalLogColRef, {
                userId: user.uid,
                savingsGoalId: goal.id,
                incomeTransactionId: incomeTransactionId,
                amountWithdrawn: withdrawalAmountInBaseCurrency,
                penaltyAmount: penaltyAmount,
                transactionCost: 0, // For now
                netAmountToUser: netAmountToUser,
                date: new Date().toISOString().split('T')[0],
                isEarlyWithdrawal: isEarly,
                createdAt: serverTimestamp(),
            } as Omit<SavingsGoalWithdrawal, 'id'>);
        } else {
            throw new Error("Failed to get income transaction ID for withdrawal logging.");
        }

      toast({ title: "Withdrawal Successful", description: `Funds moved from ${goal.name}.` });

    } catch (e) {
      console.error("Error withdrawing from savings goal: ", e);
      const errorMessage = e instanceof Error ? e.message : "Could not process withdrawal.";
      if (errorMessage !== "Early Withdrawal Not Allowed" && errorMessage !== "Invalid Withdrawal Amount" && errorMessage !== "Insufficient funds in goal.") {
         toast({ variant: "destructive", title: "Withdrawal Failed", description: errorMessage });
      }
      throw e; // Re-throw
    }
  }, [user, toast]);


  return (
    <SavingsGoalContext.Provider value={{
      savingsGoals,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      contributeToGoal,
      withdrawFromGoal,
      loadingSavingsGoals,
    }}>
      {children}
    </SavingsGoalContext.Provider>
  );
};

export const useSavingsGoals = (): SavingsGoalContextType => {
  const context = useContext(SavingsGoalContext);
  if (context === undefined) {
    throw new Error('useSavingsGoals must be used within a SavingsGoalProvider');
  }
  return context;
};
