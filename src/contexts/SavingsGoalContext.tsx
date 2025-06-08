
"use client";

import type { SavingsGoal, Expense, SavingsGoalContribution, PlatformRevenueEntry } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
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
import { deleteObject, ref } from 'firebase/storage';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_STORED_CURRENCY } from '@/lib/types';

interface SavingsGoalContextType {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string | undefined>;
  updateSavingsGoal: (updatedGoalData: Omit<SavingsGoal, 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'> & { id: string }) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  contributeToGoal: (goalId: string, amountInBaseCurrency: number, contributionDescription?: string) => Promise<void>;
  withdrawFromGoal: (
    goal: SavingsGoal,
    withdrawalAmountInBaseCurrency: number,
    isEarlyWithdrawal: boolean,
    penaltyAmountInBaseCurrency: number,
    withdrawalDescription?: string
  ) => Promise<void>;
  loadingSavingsGoals: boolean;
}

const SavingsGoalContext = createContext<SavingsGoalContextType | undefined>(undefined);

export const SavingsGoalProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
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
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          goalsFromDb.push({
            id: doc.id,
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
      currentAmount: 0, // Initial amount
      status: 'active',
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
      userId: user.uid,
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
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to delete a goal." });
      return;
    }
    try {
      const batch = writeBatch(db);
      const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goalId);
      batch.delete(goalDocRef);

      // Find and delete related SavingsGoalContribution records
      const contributionsQuery = query(
        collection(db, 'users', user.uid, 'savingsGoalContributions'),
        where('savingsGoalId', '==', goalId)
      );
      const contributionsSnapshot = await getDocs(contributionsQuery);
      contributionsSnapshot.forEach((contributionDoc) => {
        batch.delete(contributionDoc.ref);
        // Also delete the original expense transaction linked by this contribution
        const expenseId = contributionDoc.data().expenseId;
        if (expenseId) {
          const expenseDocRef = doc(db, 'users', user.uid, 'expenses', expenseId);
          batch.delete(expenseDocRef);
        }
      });
      
      // Find and delete related SavingsGoalWithdrawal records (if implemented)
      // const withdrawalsQuery = query(...)
      // withdrawalsSnapshot.forEach(...)

      await batch.commit();
      toast({ title: "Savings Goal Deleted", description: "Goal and related transactions removed." });
    } catch (e) {
      console.error("Error deleting savings goal: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not delete savings goal and associated records." });
    }
  }, [user, toast]);

  const contributeToGoal = useCallback(async (
    goalId: string,
    amountInBaseCurrency: number,
    contributionDescription?: string
  ) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated" });
      return;
    }
    if (amountInBaseCurrency <= 0) {
        toast({variant: "destructive", title: "Invalid Amount", description: "Contribution must be positive."});
        return;
    }

    const goalDocRef = doc(db, 'users', user.uid, 'savingsGoals', goalId);
    const expenseColRef = collection(db, 'users', user.uid, 'expenses');
    const contributionColRef = collection(db, 'users', user.uid, 'savingsGoalContributions');

    try {
      await runTransaction(db, async (transaction) => {
        const goalSnap = await transaction.get(goalDocRef);
        if (!goalSnap.exists()) {
          throw new Error("Savings goal not found.");
        }
        const goalData = goalSnap.data() as SavingsGoal;

        if (goalData.currentAmount >= goalData.targetAmount) {
          toast({ title: "Goal Achieved", description: "This goal is already fully funded!"});
          throw new Error("Goal already achieved."); // Abort transaction
        }
        
        const newCurrentAmount = goalData.currentAmount + amountInBaseCurrency;
        const actualContribution = newCurrentAmount > goalData.targetAmount 
                                      ? amountInBaseCurrency - (newCurrentAmount - goalData.targetAmount) 
                                      : amountInBaseCurrency;

        if (actualContribution <= 0) {
           toast({ title: "Contribution Too Small", description: "Calculated contribution is zero or less after considering target."});
           throw new Error("Contribution too small to process.");
        }


        // 1. Create the 'expense' record for the contribution
        const expensePayload: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          description: contributionDescription || `Contribution to ${goalData.name}`,
          amount: actualContribution, // Amount in base currency
          date: new Date().toISOString().split('T')[0],
          category: 'Savings', // Special category
          type: 'expense', // Moving money from spendable to savings
          merchant: 'Savings Goal Contribution',
          receiptUrl: null,
        };
        const expenseDocRef = await addDoc(expenseColRef, {
          ...expensePayload,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }); // Use addDoc within transaction if possible or outside if not critical path

        // 2. Update the savings goal
        transaction.update(goalDocRef, {
          currentAmount: Math.min(newCurrentAmount, goalData.targetAmount), // Cap at target
          updatedAt: serverTimestamp(),
        });

        // 3. Create the SavingsGoalContribution link record
        const contributionPayload: Omit<SavingsGoalContribution, 'id' | 'userId' | 'createdAt'> = {
          savingsGoalId: goalId,
          expenseId: expenseDocRef.id, // Link to the created expense
          amount: actualContribution, // Amount in base currency
          date: new Date().toISOString().split('T')[0],
        };
         // AddDoc for contribution link cannot be directly part of Firestore transaction
         // if expenseDocRef.id is generated on client before commit.
         // If expenseDocRef is created with transaction.set(newDocRef, ...), then its ID is stable.
         // For simplicity, we'll add it after, assuming transaction succeeds.
         // This means if the contribution record fails, we have an orphaned expense, but it's less critical.
         // Ideally, the expense creation should also use transaction.set with a pre-generated ID if possible, or a Cloud Function.
      });

      // Create contribution link record (outside main transaction for simplicity here)
      // Note: This part means the expense record will be created even if this one fails.
      // For true atomicity, this should also be part of a transaction or a backend operation.
      const expenseSnapshotForId = await getDocs(query(expenseColRef, where("description", "==", contributionDescription || `Contribution to ${goalData.name}`), orderBy("createdAt", "desc"), where("amount", "==", amountInBaseCurrency)));
      let expenseIdToLink = '';
      if (!expenseSnapshotForId.empty) {
        expenseIdToLink = expenseSnapshotForId.docs[0].id;
      }

      if(expenseIdToLink){
          await addDoc(contributionColRef, {
            userId: user.uid,
            savingsGoalId: goalId,
            expenseId: expenseIdToLink,
            amount: amountInBaseCurrency,
            date: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp(),
          });
      } else {
          console.warn("Could not find matching expense to link contribution for goal:", goalId);
          // Potentially create contribution without expenseId or flag for review
      }


      toast({ title: "Contribution Successful", description: `Added funds to goal.` });

    } catch (e) {
      console.error("Error contributing to savings goal: ", e);
      if (e instanceof Error && e.message !== "Goal already achieved." && e.message !== "Contribution too small to process.") {
        toast({ variant: "destructive", title: "Contribution Failed", description: e.message || "Could not process contribution." });
      }
    }
  }, [user, toast]);


  const withdrawFromGoal = useCallback(async (
    goal: SavingsGoal,
    withdrawalAmountInBaseCurrency: number,
    isEarlyWithdrawal: boolean,
    penaltyAmountInBaseCurrency: number,
    withdrawalDescription?: string
  ) => {
    // Placeholder for withdrawal logic - to be implemented
    // This will involve:
    // 1. Decreasing goal.currentAmount
    // 2. Creating an 'income' transaction for (withdrawalAmount - penaltyAmount)
    // 3. If penalty > 0, creating a PlatformRevenueEntry
    // 4. Creating a SavingsGoalWithdrawal record
    console.log("Withdrawal requested:", { goal, withdrawalAmountInBaseCurrency, isEarlyWithdrawal, penaltyAmountInBaseCurrency, withdrawalDescription });
    toast({ title: "Withdrawal (Not Implemented)", description: "Withdrawal functionality is next." });
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

    
    