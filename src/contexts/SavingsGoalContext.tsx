
"use client";

import type { SavingsGoal, Expense, SavingsGoalContribution, SavingsGoalWithdrawal, PlatformRevenueEntry, CurrencyCode } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
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
  setDoc, // Added setDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useExpenses } from './ExpenseContext';
import { DEFAULT_STORED_CURRENCY } from '@/lib/types';
import { addMonths, isPast, isValid, parseISO, isToday } from "date-fns";

interface SavingsGoalContextType {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string | undefined>;
  updateSavingsGoal: (updatedGoalData: Omit<SavingsGoal, 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'> & { id: string }) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  contributeToGoal: (goalId: string, amountInBaseCurrency: number, contributionDescription?: string) => Promise<void>;
  withdrawFromGoal: (
    goal: SavingsGoal,
    withdrawalAmountInBaseCurrency: number,
    description?: string
  ) => Promise<void>;
  loadingSavingsGoals: boolean;
  allPlatformSavingsGoals: SavingsGoal[]; // For admin stats
  loadingAllPlatformSavingsGoals: boolean; // For admin stats
}

const SavingsGoalContext = createContext<SavingsGoalContextType | undefined>(undefined);

const calculateTransactionCost = (withdrawalAmount: number): number => {
  const minCost = 0.50;
  const maxCost = 15.00;
  let cost = 0;
  if (withdrawalAmount <= 0) return 0;
  if (withdrawalAmount <= 200) cost = withdrawalAmount * 0.01;
  else if (withdrawalAmount <= 1000) cost = 2.00 + (withdrawalAmount - 200) * 0.005;
  else cost = 2.00 + (800 * 0.005) + (withdrawalAmount - 1000) * 0.0025;
  cost = Math.max(minCost, cost);
  cost = Math.min(maxCost, cost);
  return parseFloat(cost.toFixed(2));
};

export const SavingsGoalProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { expenses: userExpenses } = useExpenses();
  const { toast } = useToast();

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loadingSavingsGoals, setLoadingSavingsGoals] = useState(true);
  const [allPlatformSavingsGoals, setAllPlatformSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loadingAllPlatformSavingsGoals, setLoadingAllPlatformSavingsGoals] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoadingSavingsGoals(true);
      setLoadingAllPlatformSavingsGoals(true);
      return;
    }

    let unsubscribeUserGoals: (() => void) | undefined;
    if (user?.uid) {
      setLoadingSavingsGoals(true);
      const goalsCol = collection(db, 'users', user.uid, 'savingsGoals');
      const qUserGoals = query(goalsCol, orderBy('createdAt', 'desc'));
      unsubscribeUserGoals = onSnapshot(qUserGoals, (querySnapshot) => {
        const goalsFromDb: SavingsGoal[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          goalsFromDb.push({
            id: docSnapshot.id, ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
            updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
          } as SavingsGoal);
        });
        setSavingsGoals(goalsFromDb);
        setLoadingSavingsGoals(false);
      }, (error) => {
        console.error("Error fetching user savings goals: ", error);
        setLoadingSavingsGoals(false);
      });
    } else {
      setSavingsGoals([]);
      setLoadingSavingsGoals(false);
    }

    // Fetch all platform savings goals
    setLoadingAllPlatformSavingsGoals(true);
    const allGoalsQuery = query(collection(db, 'savings_goals_all'), orderBy('createdAt', 'desc'));
    const unsubscribeAllPlatformGoals = onSnapshot(allGoalsQuery, (snapshot) => {
        const platformGoalsData: SavingsGoal[] = [];
        snapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            platformGoalsData.push({
                 id: docSnapshot.id, ...data,
                 createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
                 updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
            } as SavingsGoal);
        });
        setAllPlatformSavingsGoals(platformGoalsData);
        setLoadingAllPlatformSavingsGoals(false);
    }, (error) => {
        console.error("Error fetching all platform savings goals: ", error);
        setAllPlatformSavingsGoals([]);
        setLoadingAllPlatformSavingsGoals(false);
    });

    return () => {
      if (unsubscribeUserGoals) unsubscribeUserGoals();
      unsubscribeAllPlatformGoals();
    };
  }, [user, authLoading, toast]);

  const addSavingsGoal = useCallback(async (
    goalData: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string | undefined> => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated" }); return undefined;
    }
    const newGoalPayload = {
      ...goalData, userId: user.uid, currentAmount: 0, status: 'active' as SavingsGoal['status'],
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    };
    try {
      const userGoalsCol = collection(db, 'users', user.uid, 'savingsGoals');
      const docRef = await addDoc(userGoalsCol, newGoalPayload);
      // Also add to savings_goals_all collection
      await setDoc(doc(collection(db, 'savings_goals_all'), docRef.id), { ...newGoalPayload, id: docRef.id });
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
      toast({ variant: "destructive", title: "Not Authenticated" }); return;
    }
    const { id, ...dataToUpdate } = updatedGoalData;
    const goalPayloadForUpdate = { ...dataToUpdate, updatedAt: serverTimestamp()};
    const goalPayloadForPlatform = { ...dataToUpdate, userId: user.uid, id: id, updatedAt: serverTimestamp()}; // ensure userId and id for platform
    try {
      const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', id);
      await updateDoc(goalDocRef, goalPayloadForUpdate);
      // Also update in savings_goals_all
      const platformGoalDocRef = doc(db, 'savings_goals_all', id);
      await setDoc(platformGoalDocRef, goalPayloadForPlatform, { merge: true }); // Use setDoc with merge for platform
      toast({ title: "Savings Goal Updated", description: `Goal "${updatedGoalData.name}" updated.` });
    } catch (e) {
      console.error("Error updating savings goal: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not update savings goal." });
    }
  }, [user, toast]);

  const deleteSavingsGoal = useCallback(async (goalId: string) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated" }); return;
    }
    try {
      const batchCommits = writeBatch(db);
      const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goalId);
      batchCommits.delete(goalDocRef);
      // Also delete from savings_goals_all
      const platformGoalDocRef = doc(db, 'savings_goals_all', goalId);
      batchCommits.delete(platformGoalDocRef);

      // Delete related contributions and their expenses
      const contributionsQuery = query(collection(db, 'users', user.uid, 'savingsGoalContributions'), where('savingsGoalId', '==', goalId));
      const contributionsSnapshot = await getDocs(contributionsQuery);
      contributionsSnapshot.forEach((contributionDoc) => {
        batchCommits.delete(contributionDoc.ref);
        const expenseId = contributionDoc.data().expenseId;
        if (expenseId) {
          batchCommits.delete(doc(db, 'users', user.uid, 'expenses', expenseId));
          batchCommits.delete(doc(db, 'expenses_all', expenseId));
        }
      });
      
      // Delete related withdrawals and their income transactions
      const withdrawalsQuery = query(collection(db, 'users', user.uid, 'savingsGoalWithdrawals'), where('savingsGoalId', '==', goalId));
      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      withdrawalsSnapshot.forEach((withdrawalDoc) => {
        batchCommits.delete(withdrawalDoc.ref);
        const incomeTxId = withdrawalDoc.data().incomeTransactionId;
        if (incomeTxId) {
          batchCommits.delete(doc(db, 'users', user.uid, 'expenses', incomeTxId));
          batchCommits.delete(doc(db, 'expenses_all', incomeTxId));
        }
      });
      
      // Delete related platform revenue entries
      const penaltyRevenueQuery = query(collection(db, 'platformRevenue'), where('relatedGoalId', '==', goalId), where('type', '==', 'penalty'));
      const penaltyRevenueSnapshot = await getDocs(penaltyRevenueQuery);
      penaltyRevenueSnapshot.forEach(docSnapshot => batchCommits.delete(docSnapshot.ref));

      const feeRevenueQuery = query(collection(db, 'platformRevenue'), where('relatedGoalId', '==', goalId), where('type', '==', 'transaction_fee'));
      const feeRevenueSnapshot = await getDocs(feeRevenueQuery);
      feeRevenueSnapshot.forEach(docSnapshot => batchCommits.delete(docSnapshot.ref));

      await batchCommits.commit();
      toast({ title: "Savings Goal Deleted", description: "Goal and related records removed." });
    } catch (e) {
      console.error("Error deleting savings goal: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not delete goal." });
    }
  }, [user, toast]);

  const contributeToGoal = useCallback(async (
    goalId: string, amountInBaseCurrency: number, contributionDescription?: string
  ) => {
    if (!user?.uid) { toast({ variant: "destructive", title: "Not Authenticated" }); throw new Error("Not Authenticated"); }
    if (amountInBaseCurrency <= 0) { toast({ variant: "destructive", title: "Invalid Amount" }); throw new Error("Invalid Amount"); }

    const totalIncome = userExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const totalCurrentSavingsContributions = userExpenses.filter(e => e.category === 'Savings').reduce((sum, e) => sum + e.amount, 0);
    const spendableIncome = totalIncome - totalCurrentSavingsContributions;

    if (amountInBaseCurrency > spendableIncome) {
      toast({ variant: "destructive", title: "Insufficient Income" });
      throw new Error("Insufficient spendable income to make this contribution.");
    }

    const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goalId);
    const expenseColRef = collection(db, 'users', user.uid, 'expenses');
    const allExpensesColRef = collection(db, 'expenses_all');
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
        const actualContribution = newCurrentAmount > goalData.targetAmount ? amountInBaseCurrency - (newCurrentAmount - goalData.targetAmount) : amountInBaseCurrency;
        if (actualContribution <= 0) throw new Error("Contribution too small to process.");

        const expensePayload: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          description: contributionDescription || `Contribution to ${goalData.name}`,
          amount: actualContribution, date: new Date().toISOString().split('T')[0], category: 'Savings', type: 'expense',
          merchant: 'Savings Goal Contribution', receiptUrl: null, relatedSavingsGoalId: goalId,
        };
        
        const newExpenseDocRef = doc(expenseColRef); expenseIdToLink = newExpenseDocRef.id;
        const fullExpenseDataForStorage = { ...expensePayload, id: expenseIdToLink, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        transaction.set(newExpenseDocRef, fullExpenseDataForStorage);
        transaction.set(doc(allExpensesColRef, expenseIdToLink), fullExpenseDataForStorage);

        transaction.update(goalDocRef, {
          currentAmount: Math.min(newCurrentAmount, goalData.targetAmount), updatedAt: serverTimestamp(),
          status: Math.min(newCurrentAmount, goalData.targetAmount) >= goalData.targetAmount && goalData.withdrawalCondition === 'targetAmountReached' ? 'matured' : goalData.status,
        });
        // Also update in savings_goals_all
        transaction.update(doc(db, 'savings_goals_all', goalId), {
            currentAmount: Math.min(newCurrentAmount, goalData.targetAmount), updatedAt: serverTimestamp(),
            status: Math.min(newCurrentAmount, goalData.targetAmount) >= goalData.targetAmount && goalData.withdrawalCondition === 'targetAmountReached' ? 'matured' : goalData.status,
        });
      });

      if (expenseIdToLink) {
         await addDoc(contributionColRef, {
            userId: user.uid, savingsGoalId: goalId, expenseId: expenseIdToLink, amount: amountInBaseCurrency, 
            date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp(),
        });
      } else { throw new Error("Failed to get new expense ID for contribution linking."); }
      toast({ title: "Contribution Successful" });
    } catch (e) {
      console.error("Error contributing to savings goal: ", e);
      const errorMessage = e instanceof Error ? e.message : "Could not process contribution.";
      if (errorMessage !== "Insufficient spendable income to make this contribution." && errorMessage !== "Goal already achieved." && errorMessage !== "Contribution too small to process.") {
        toast({ variant: "destructive", title: "Contribution Failed", description: errorMessage });
      } throw e; 
    }
  }, [user, userExpenses, toast]);

  const withdrawFromGoal = useCallback(async (
    goal: SavingsGoal, grossAmountToWithdrawFromGoal: number, description?: string
  ) => {
    if (!user?.uid) { toast({ variant: "destructive", title: "Not Authenticated" }); throw new Error("Not Authenticated"); }

    const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
    const expenseColRef = collection(db, 'users', user.uid, 'expenses');
    const allExpensesColRef = collection(db, 'expenses_all');
    const withdrawalLogColRef = collection(db, 'users', user.uid, 'savingsGoalWithdrawals');
    const platformRevenueColRef = collection(db, 'platformRevenue');

    let isEarly = true; let effectiveMaturityDate: Date | null = null;
    const isGoalFunded = goal.currentAmount >= goal.targetAmount;

    if (goal.withdrawalCondition === 'targetAmountReached' && isGoalFunded) isEarly = false;
    else {
      if (goal.targetDate) {
        try { const tDate = parseISO(goal.targetDate); if (isValid(tDate)) { effectiveMaturityDate = tDate; if (isPast(tDate) || isToday(tDate)) isEarly = false; } } catch (e) {}
      } else if (goal.startDate && goal.durationMonths) {
        try { const sDate = parseISO(goal.startDate); if (isValid(sDate)) { effectiveMaturityDate = addMonths(sDate, goal.durationMonths); if (isPast(effectiveMaturityDate) || isToday(effectiveMaturityDate)) isEarly = false; } } catch (e) {}
      }
    }
    if (isEarly && !goal.allowsEarlyWithdrawal) { toast({ variant: "destructive", title: "Early Withdrawal Not Allowed" }); throw new Error("Early withdrawal is not allowed for this goal."); }
    if (grossAmountToWithdrawFromGoal <= 0) { toast({variant: "destructive", title: "No Funds" }); throw new Error("No funds to withdraw."); }
    if (grossAmountToWithdrawFromGoal > goal.currentAmount) { toast({ variant: "destructive", title: "Invalid Amount" }); throw new Error("Attempting to withdraw more than available."); }

    const penaltyRate = goal.earlyWithdrawalPenaltyRate;
    const calculatedPenalty = isEarly && goal.allowsEarlyWithdrawal && penaltyRate > 0 ? goal.targetAmount * penaltyRate : 0;
    const calculatedTransactionCost = calculateTransactionCost(grossAmountToWithdrawFromGoal);
    let actualPenaltyCollected = 0, actualTransactionCostCollected = 0, netAmountToUser = 0;

    if (calculatedPenalty >= grossAmountToWithdrawFromGoal) { actualPenaltyCollected = grossAmountToWithdrawFromGoal; } 
    else {
      actualPenaltyCollected = calculatedPenalty;
      const amountRemainingAfterPenalty = grossAmountToWithdrawFromGoal - actualPenaltyCollected;
      if (calculatedTransactionCost >= amountRemainingAfterPenalty) actualTransactionCostCollected = amountRemainingAfterPenalty;
      else { actualTransactionCostCollected = calculatedTransactionCost; netAmountToUser = amountRemainingAfterPenalty - actualTransactionCostCollected; }
    }
    actualPenaltyCollected = Math.max(0, actualPenaltyCollected); actualTransactionCostCollected = Math.max(0, actualTransactionCostCollected); netAmountToUser = Math.max(0, netAmountToUser);
    if (netAmountToUser <= 0 && grossAmountToWithdrawFromGoal > 0) { toast({ variant: "destructive", title: "Withdrawal Not Allowed" }); throw new Error("Withdrawal not allowed: Net amount after deductions is zero or less."); }

    let incomeTransactionId = '';
    try {
      await runTransaction(db, async (transaction) => {
        const goalSnap = await transaction.get(goalDocRef);
        if (!goalSnap.exists()) throw new Error("Savings goal not found.");
        const currentGoalData = goalSnap.data() as SavingsGoal;
        if (currentGoalData.currentAmount < grossAmountToWithdrawFromGoal) throw new Error("Insufficient funds in goal at time of transaction.");

        const newGoalCurrentAmount = currentGoalData.currentAmount - grossAmountToWithdrawFromGoal;
        let newGoalStatus = currentGoalData.status;
        if (isEarly && goal.allowsEarlyWithdrawal) newGoalStatus = 'withdrawnEarly';
        else if (newGoalCurrentAmount <= 0 && ((currentGoalData.withdrawalCondition === 'targetAmountReached' && (currentGoalData.currentAmount >= currentGoalData.targetAmount)) || (currentGoalData.withdrawalCondition === 'maturityDateReached' && !isEarly))) newGoalStatus = 'completed';
        
        transaction.update(goalDocRef, { currentAmount: newGoalCurrentAmount, status: newGoalStatus, updatedAt: serverTimestamp() });
        // Also update in savings_goals_all
        transaction.update(doc(db, 'savings_goals_all', goal.id), { currentAmount: newGoalCurrentAmount, status: newGoalStatus, updatedAt: serverTimestamp() });


        if (netAmountToUser > 0) {
          const incomePayload: Omit<Expense, 'id'|'userId'|'createdAt'|'updatedAt'> = {
            description: description || `Withdrawal from ${goal.name}`, amount: netAmountToUser, date: new Date().toISOString().split('T')[0],
            category: 'Savings Withdrawal', type: 'income', relatedSavingsGoalId: goal.id,
          };
          const newIncomeDocRef = doc(expenseColRef); incomeTransactionId = newIncomeDocRef.id;
          const fullIncomeDataForStorage = { ...incomePayload, id: incomeTransactionId, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
          transaction.set(newIncomeDocRef, fullIncomeDataForStorage);
          transaction.set(doc(allExpensesColRef, incomeTransactionId), fullIncomeDataForStorage);
        }
        if (actualPenaltyCollected > 0) {
          const penaltyRevenuePayload: Omit<PlatformRevenueEntry, 'id'|'createdAt'> = {
            userId: user.uid!, relatedGoalId: goal.id, type: 'penalty', amount: actualPenaltyCollected,
            description: `Early withdrawal penalty from goal: ${goal.name}`, date: new Date().toISOString().split('T')[0],
          };
          transaction.set(doc(platformRevenueColRef), {...penaltyRevenuePayload, createdAt: serverTimestamp()});
        }
        if (actualTransactionCostCollected > 0) {
          const costRevenuePayload: Omit<PlatformRevenueEntry, 'id'|'createdAt'> = {
            userId: user.uid!, relatedGoalId: goal.id, type: 'transaction_fee', amount: actualTransactionCostCollected,
            description: `Transaction fee for withdrawal from goal: ${goal.name}`, date: new Date().toISOString().split('T')[0],
          };
          transaction.set(doc(platformRevenueColRef), {...costRevenuePayload, createdAt: serverTimestamp()});
        }
      });
      await addDoc(withdrawalLogColRef, {
        userId: user.uid, savingsGoalId: goal.id, incomeTransactionId: netAmountToUser > 0 ? incomeTransactionId : null,
        amountWithdrawn: grossAmountToWithdrawFromGoal, penaltyAmount: actualPenaltyCollected, transactionCost: actualTransactionCostCollected,
        netAmountToUser: netAmountToUser, date: new Date().toISOString().split('T')[0], isEarlyWithdrawal: isEarly, createdAt: serverTimestamp(),
      } as Omit<SavingsGoalWithdrawal, 'id'>);
      toast({ title: "Withdrawal Processed" });
    } catch (e) {
      console.error("Error withdrawing from savings goal: ", e);
      const errorMessage = e instanceof Error ? e.message : "Could not process withdrawal.";
      if (errorMessage !== "Early Withdrawal Not Allowed" && errorMessage !== "Invalid withdrawal amount." && errorMessage !== "Insufficient funds in goal at time of transaction." && errorMessage !== "Withdrawal not allowed: Net amount after deductions is zero or less." && errorMessage !== "No funds to withdraw.") {
         toast({ variant: "destructive", title: "Withdrawal Failed", description: errorMessage });
      } throw e; 
    }
  }, [user, toast]);

  return (
    <SavingsGoalContext.Provider value={{
      savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
      contributeToGoal, withdrawFromGoal, loadingSavingsGoals,
      allPlatformSavingsGoals, loadingAllPlatformSavingsGoals,
    }}>
      {children}
    </SavingsGoalContext.Provider>
  );
};

export const useSavingsGoals = (): SavingsGoalContextType => {
  const context = useContext(SavingsGoalContext);
  if (context === undefined) throw new Error('useSavingsGoals must be used within a SavingsGoalProvider');
  return context;
};
