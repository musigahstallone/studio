
"use client";

import type { SavingsGoal, Expense, SavingsGoalContribution, SavingsGoalWithdrawal, PlatformRevenueEntry, CurrencyCode } from '@/lib/types';
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
import { DEFAULT_STORED_CURRENCY } from '@/lib/types'; // Import DEFAULT_STORED_CURRENCY

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

// Helper function for transaction cost calculation
// All monetary values in this function are assumed to be in DEFAULT_STORED_CURRENCY (USD)
const calculateTransactionCost = (withdrawalAmount: number): number => {
  const minCost = 0.50;
  const maxCost = 15.00;
  let cost = 0;

  if (withdrawalAmount <= 0) return 0;

  if (withdrawalAmount <= 200) {
    cost = withdrawalAmount * 0.01; // 1%
  } else if (withdrawalAmount <= 1000) {
    cost = 2.00 + (withdrawalAmount - 200) * 0.005; // $2.00 base + 0.5% of amount over $200
  } else {
    cost = 2.00 + (800 * 0.005) + (withdrawalAmount - 1000) * 0.0025; // $2 (tier1) + $4 (tier2) + 0.25% of amount over $1000
    // $2.00 + $4.00 = $6.00 base for this tier
  }

  cost = Math.max(minCost, cost);
  cost = Math.min(maxCost, cost);

  return parseFloat(cost.toFixed(2)); // Ensure two decimal places
};


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
      status: 'active' as SavingsGoal['status'],
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
        
        const newExpenseDocRef = doc(expenseColRef); 
        expenseIdToLink = newExpenseDocRef.id; 

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

      if (expenseIdToLink) {
         await addDoc(contributionColRef, {
            userId: user.uid,
            savingsGoalId: goalId,
            expenseId: expenseIdToLink,
            amount: amountInBaseCurrency, 
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
      throw e; 
    }
  }, [user, userExpenses, toast]);

  const withdrawFromGoal = useCallback(async (
    goal: SavingsGoal,
    // For full withdrawal, this is effectively goal.currentAmount at the time of withdrawal
    grossAmountToWithdrawFromGoal: number, 
    description?: string
  ) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      throw new Error("Not Authenticated");
    }
    if (grossAmountToWithdrawFromGoal <= 0 || grossAmountToWithdrawFromGoal > goal.currentAmount) {
      toast({ variant: "destructive", title: "Invalid Withdrawal Amount" });
      throw new Error("Invalid withdrawal amount. Requested more than available or zero.");
    }

    const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
    const expenseColRef = collection(db, 'users', user.uid, 'expenses');
    const withdrawalLogColRef = collection(db, 'users', user.uid, 'savingsGoalWithdrawals');
    const platformRevenueColRef = collection(db, 'platformRevenue');

    let isEarly = false;
    let effectiveMaturityDate: Date | null = null;
    if (goal.targetDate) {
        effectiveMaturityDate = new Date(goal.targetDate);
        isEarly = new Date() < effectiveMaturityDate;
    } else if (goal.startDate && goal.durationMonths) {
        const sDate = new Date(goal.startDate);
        effectiveMaturityDate = new Date(sDate.setMonth(sDate.getMonth() + goal.durationMonths));
        isEarly = new Date() < effectiveMaturityDate;
    }
    
    if (isEarly && !goal.allowsEarlyWithdrawal) {
      toast({ variant: "destructive", title: "Early Withdrawal Not Allowed" });
      throw new Error("Early withdrawal is not allowed for this goal.");
    }

    // Calculate penalty based on targetAmount
    const penaltyRate = goal.earlyWithdrawalPenaltyRate;
    const calculatedPenalty = isEarly && goal.allowsEarlyWithdrawal && penaltyRate > 0 
                               ? goal.targetAmount * penaltyRate 
                               : 0;
    
    // Calculate transaction cost based on the gross amount being withdrawn from the goal
    const calculatedTransactionCost = calculateTransactionCost(grossAmountToWithdrawFromGoal);

    let actualPenaltyCollected = 0;
    let actualTransactionCostCollected = 0;
    let netAmountToUser = 0;

    if (calculatedPenalty >= grossAmountToWithdrawFromGoal) {
        actualPenaltyCollected = grossAmountToWithdrawFromGoal;
        actualTransactionCostCollected = 0; // No funds left for transaction cost
        netAmountToUser = 0;
    } else {
        actualPenaltyCollected = calculatedPenalty;
        const amountRemainingAfterPenalty = grossAmountToWithdrawFromGoal - actualPenaltyCollected;
        if (calculatedTransactionCost >= amountRemainingAfterPenalty) {
            actualTransactionCostCollected = amountRemainingAfterPenalty;
            netAmountToUser = 0;
        } else {
            actualTransactionCostCollected = calculatedTransactionCost;
            netAmountToUser = amountRemainingAfterPenalty - actualTransactionCostCollected;
        }
    }
    
    // Ensure amounts are positive or zero
    actualPenaltyCollected = Math.max(0, actualPenaltyCollected);
    actualTransactionCostCollected = Math.max(0, actualTransactionCostCollected);
    netAmountToUser = Math.max(0, netAmountToUser);

    let incomeTransactionId = '';

    try {
      await runTransaction(db, async (transaction) => {
        const goalSnap = await transaction.get(goalDocRef);
        if (!goalSnap.exists()) throw new Error("Savings goal not found.");
        const currentGoalData = goalSnap.data() as SavingsGoal;
        // Re-check currentAmount inside transaction to prevent race conditions
        if (currentGoalData.currentAmount < grossAmountToWithdrawFromGoal) {
            throw new Error("Insufficient funds in goal at time of transaction.");
        }

        const newGoalCurrentAmount = currentGoalData.currentAmount - grossAmountToWithdrawFromGoal;
        let newGoalStatus = currentGoalData.status;
        
        if (isEarly) newGoalStatus = 'withdrawnEarly';
        else if (newGoalCurrentAmount <= 0 && currentGoalData.currentAmount >= currentGoalData.targetAmount) newGoalStatus = 'completed';
        else if (newGoalCurrentAmount <= 0) newGoalStatus = 'active'; // Or 'cancelled' if implies choice, current keeps it active if partially withdrawn

        transaction.update(goalDocRef, {
          currentAmount: newGoalCurrentAmount,
          status: newGoalStatus,
          updatedAt: serverTimestamp(),
        });

        // Create Income Transaction for User (only if net amount is positive)
        if (netAmountToUser > 0) {
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
        }

        // Create Platform Revenue Entry for Penalty (if any)
        if (actualPenaltyCollected > 0) {
            const penaltyRevenuePayload: Omit<PlatformRevenueEntry, 'id'|'createdAt'> = {
                userId: user.uid,
                relatedGoalId: goal.id,
                type: 'penalty',
                amount: actualPenaltyCollected,
                description: `Early withdrawal penalty from goal: ${goal.name}`,
                date: new Date().toISOString().split('T')[0],
            };
            const newPenaltyRevenueDocRef = doc(platformRevenueColRef);
            transaction.set(newPenaltyRevenueDocRef, {...penaltyRevenuePayload, createdAt: serverTimestamp()});
        }
        // Create Platform Revenue Entry for Transaction Cost (if any)
        if (actualTransactionCostCollected > 0) {
            const costRevenuePayload: Omit<PlatformRevenueEntry, 'id'|'createdAt'> = {
                userId: user.uid,
                relatedGoalId: goal.id,
                type: 'transaction_fee',
                amount: actualTransactionCostCollected,
                description: `Transaction fee for withdrawal from goal: ${goal.name}`,
                date: new Date().toISOString().split('T')[0],
            };
            const newCostRevenueDocRef = doc(platformRevenueColRef);
            transaction.set(newCostRevenueDocRef, {...costRevenuePayload, createdAt: serverTimestamp()});
        }
      });

      // Log the withdrawal (outside transaction)
       await addDoc(withdrawalLogColRef, {
            userId: user.uid,
            savingsGoalId: goal.id,
            incomeTransactionId: netAmountToUser > 0 ? incomeTransactionId : null, // Only if income was created
            amountWithdrawn: grossAmountToWithdrawFromGoal,
            penaltyAmount: actualPenaltyCollected,
            transactionCost: actualTransactionCostCollected,
            netAmountToUser: netAmountToUser,
            date: new Date().toISOString().split('T')[0],
            isEarlyWithdrawal: isEarly,
            createdAt: serverTimestamp(),
        } as Omit<SavingsGoalWithdrawal, 'id'>);

      toast({ title: "Withdrawal Processed", description: `Funds actioned for goal: ${goal.name}.` });

    } catch (e) {
      console.error("Error withdrawing from savings goal: ", e);
      const errorMessage = e instanceof Error ? e.message : "Could not process withdrawal.";
      if (errorMessage !== "Early Withdrawal Not Allowed" && errorMessage !== "Invalid withdrawal amount." && errorMessage !== "Insufficient funds in goal at time of transaction.") {
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
