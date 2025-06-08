
"use client";

import type { Expense, Budget } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
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
  getDocs
} from 'firebase/firestore';
import { useAuth } from './AuthContext'; // Import useAuth
import { useToast } from '@/hooks/use-toast';

// Initial mock data can be used to seed the DB for a new user if desired, or removed.
// For this iteration, we'll primarily focus on fetching from Firestore.
const initialExpensesData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  { type: 'expense', description: 'Initial Coffee', amount: 5.50, date: '2024-07-01', category: 'Food & Drink', merchant: 'My Cafe' },
  { type: 'income', description: 'Initial Salary', amount: 1500, date: '2024-07-01', category: 'Salary' },
];

const initialBudgetsData: Omit<Budget, 'id' | 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'My Food Budget', category: 'Food & Drink', amount: 300 },
];


interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'receiptUrl'>, receiptUrl?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (updatedExpense: Partial<Expense> & { id: string }) => Promise<void>; // Changed type
  loadingExpenses: boolean;
  allPlatformExpenses: Expense[]; // For admin view (conceptual, needs secure implementation)
  loadingAllPlatformExpenses: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // For admin view - conceptual. In real app, admin would have different queries.
  // This mock "all platform" will just fetch all expenses regardless of user for now for local demo.
  // WARNING: This is NOT secure for a production app without proper Firestore rules & admin backend.
  const [allPlatformExpenses, setAllPlatformExpenses] = useState<Expense[]>([]);
  const [loadingAllPlatformExpenses, setLoadingAllPlatformExpenses] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoadingExpenses(true);
      setLoadingAllPlatformExpenses(true);
      return;
    }

    let unsubscribeUserExpenses: (() => void) | undefined;
    if (user?.uid) {
      setLoadingExpenses(true);
      const expensesCol = collection(db, 'users', user.uid, 'expenses');
      const q = query(expensesCol, orderBy('date', 'desc'));
      
      unsubscribeUserExpenses = onSnapshot(q, (querySnapshot) => {
        const userExpensesFromDb: Expense[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userExpensesFromDb.push({ 
            id: doc.id, 
            ...data,
            // Firestore timestamps need to be converted
            date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString().split('T')[0] : data.date as string,
            createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
            updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
          } as Expense);
        });
        setExpenses(userExpensesFromDb);
        setLoadingExpenses(false);
      }, (error) => {
        console.error("Error fetching user expenses: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your expenses." });
        setLoadingExpenses(false);
      });
    } else {
      setExpenses([]); // Clear expenses if user logs out
      setLoadingExpenses(false);
    }

    // Mock "All Platform Expenses" - In a real app, this would be a secure admin query
    // For now, it just fetches ALL expenses collection. DANGEROUS without rules.
    setLoadingAllPlatformExpenses(true);
    const allExpensesQuery = query(collection(db, 'expenses_all'), orderBy('date', 'desc')); // Using a conceptual 'expenses_all' collection
    const unsubscribeAllExpenses = onSnapshot(allExpensesQuery, (snapshot) => {
        const platformExpenses: Expense[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            platformExpenses.push({
                 id: doc.id,
                 ...data,
                 date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString().split('T')[0] : data.date as string,
                 createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
                 updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
            } as Expense);
        });
        setAllPlatformExpenses(platformExpenses);
        setLoadingAllPlatformExpenses(false);
    }, (error) => {
        console.error("Error fetching all platform expenses (mock): ", error);
        setAllPlatformExpenses([]); // Fallback
        setLoadingAllPlatformExpenses(false);
    });


    return () => {
      if (unsubscribeUserExpenses) unsubscribeUserExpenses();
      unsubscribeAllExpenses();
    };
  }, [user, authLoading, toast]);


  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'receiptUrl'>, receiptUrl?: string) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to add an expense." });
      return;
    }
    const newExpensePayload = {
      ...expenseData,
      userId: user.uid,
      receiptUrl: receiptUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const userExpensesCol = collection(db, 'users', user.uid, 'expenses');
      const docRef = await addDoc(userExpensesCol, newExpensePayload);
      // Also add to a conceptual 'expenses_all' collection for platform view (DANGEROUS for prod without rules/functions)
      await addDoc(collection(db, 'expenses_all'), { ...newExpensePayload, id: docRef.id });

      toast({ title: "Transaction Added", description: `${expenseData.description} - $${expenseData.amount.toFixed(2)}` });
    } catch (e) {
      console.error("Error adding expense: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not add transaction." });
    }
  }, [user, toast]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to delete an expense." });
      return;
    }
    try {
      const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
      await deleteDoc(expenseDocRef);
      // Also delete from 'expenses_all'
      const allExpenseDocRef = doc(db, 'expenses_all', id); // Assuming ID is same
      await deleteDoc(allExpenseDocRef);

      toast({ title: "Transaction Deleted" });
    } catch (e) {
      console.error("Error deleting expense: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not delete transaction." });
    }
  }, [user, toast]);

  const updateExpense = useCallback(async (updatedExpenseData: Partial<Expense> & { id: string }) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to update an expense." });
      return;
    }
    // Destructure to explicitly exclude id, createdAt, userId, and updatedAt from the initial spread
    const { id, createdAt, userId, updatedAt, ...dataToUpdate } = updatedExpenseData;

    // This payload is for the user-specific document
    const payloadForUserDoc: Record<string, any> = {
      ...dataToUpdate, // Contains all form-modifiable fields
      updatedAt: serverTimestamp(),
      // userId is not included here as it's part of the document path and shouldn't change for user's own expense
    };
    
    // Handle receiptUrl explicitly: if it's present in updatedExpenseData, use its value (can be null or a string)
    // If not present in updatedExpenseData, it means the form didn't touch this field, so don't include it in the payload.
    if (updatedExpenseData.hasOwnProperty('receiptUrl')) {
      payloadForUserDoc.receiptUrl = updatedExpenseData.receiptUrl === undefined ? null : updatedExpenseData.receiptUrl;
    }

    try {
      const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
      await updateDoc(expenseDocRef, payloadForUserDoc);
      
      // This payload is for the 'expenses_all' collection document
      const payloadForAllDoc: Record<string, any> = {
        ...payloadForUserDoc, // Start with the same base as the user's document update
        userId: updatedExpenseData.userId || user.uid, // Ensure userId is correctly set for the 'expenses_all' collection
                                                        // Prefers original userId if available (e.g., for future admin edits), otherwise current user.
      };
      // `updatedAt` is already in payloadForUserDoc from serverTimestamp()

      const allExpenseDocRef = doc(db, 'expenses_all', id);
      await updateDoc(allExpenseDocRef, payloadForAllDoc);
      
      toast({ title: "Transaction Updated" });
    } catch (e) {
      console.error("Error updating expense: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not update transaction." });
    }
  }, [user, toast]);

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      addExpense, 
      deleteExpense, 
      updateExpense,
      loadingExpenses,
      allPlatformExpenses, // For admin dashboard
      loadingAllPlatformExpenses
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};


interface BudgetContextActualType {
  budgets: Budget[];
  addBudget: (budgetData: Omit<Budget, 'id' | 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (updatedBudget: Omit<Budget, 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loadingBudgets: boolean;
  allPlatformBudgets: Budget[]; // For admin view
  loadingAllPlatformBudgets: boolean;
}

const BudgetContextActual = createContext<BudgetContextActualType | undefined>(undefined);

export const BudgetProviderActual = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { expenses, loadingExpenses } = useExpenses(); // Use expenses to calculate spentAmount
  const { toast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);

  // For admin view - conceptual.
  const [allPlatformBudgetsData, setAllPlatformBudgetsData] = useState<Budget[]>([]);
  const [loadingAllPlatformBudgets, setLoadingAllPlatformBudgets] = useState(true);
  const { allPlatformExpenses, loadingAllPlatformExpenses } = useExpenses();


  useEffect(() => {
    if (authLoading) {
      setLoadingBudgets(true);
      return;
    }

    let unsubscribeUserBudgets: (() => void) | undefined;
    if (user?.uid) {
      setLoadingBudgets(true);
      const budgetsCol = collection(db, 'users', user.uid, 'budgets');
      const q = query(budgetsCol, orderBy('name'));

      unsubscribeUserBudgets = onSnapshot(q, (querySnapshot) => {
        const userBudgetsFromDb: Omit<Budget, 'spentAmount'>[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userBudgetsFromDb.push({ 
            id: doc.id, 
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
            updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
           } as Omit<Budget, 'spentAmount'>);
        });
        // Calculate spentAmount for each budget
        const processedBudgets = userBudgetsFromDb.map(budget => {
            const spent = expenses // user-specific expenses
              .filter(e => e.category === budget.category && e.type === 'expense')
              .reduce((sum, e) => sum + e.amount, 0);
            return { ...budget, spentAmount: spent };
        });
        setBudgets(processedBudgets);
        setLoadingBudgets(false);
      }, (error) => {
        console.error("Error fetching user budgets: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your budgets." });
        setLoadingBudgets(false);
      });
    } else {
      setBudgets([]);
      setLoadingBudgets(false);
    }

    // Mock "All Platform Budgets"
    setLoadingAllPlatformBudgets(true);
    const allBudgetsQuery = query(collection(db, 'budgets_all'), orderBy('name')); // Conceptual 'budgets_all'
    const unsubscribeAllBudgets = onSnapshot(allBudgetsQuery, (snapshot) => {
        const platformBudgetsRaw: Omit<Budget, 'spentAmount'>[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            platformBudgetsRaw.push({ 
                id: doc.id, 
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
                updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
            } as Omit<Budget, 'spentAmount'>);
        });
         const processedPlatformBudgets = platformBudgetsRaw.map(budget => {
            const spent = allPlatformExpenses
              .filter(e => e.userId === budget.userId && e.category === budget.category && e.type === 'expense')
              .reduce((sum, e) => sum + e.amount, 0);
            return { ...budget, spentAmount: spent };
        });
        setAllPlatformBudgetsData(processedPlatformBudgets);
        setLoadingAllPlatformBudgets(false);

    }, (error) => {
        console.error("Error fetching all platform budgets (mock): ", error);
        setAllPlatformBudgetsData([]);
        setLoadingAllPlatformBudgets(false);
    });


    return () => {
      if (unsubscribeUserBudgets) unsubscribeUserBudgets();
      unsubscribeAllBudgets();
    };
  }, [user, authLoading, expenses, toast, allPlatformExpenses]);


  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id' | 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to add a budget." });
      return;
    }
    const newBudgetPayload = {
      ...budgetData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const userBudgetsCol = collection(db, 'users', user.uid, 'budgets');
      const docRef = await addDoc(userBudgetsCol, newBudgetPayload);
      // Also add to 'budgets_all'
      await addDoc(collection(db, 'budgets_all'), { ...newBudgetPayload, id: docRef.id });
      toast({ title: "Budget Set", description: `${budgetData.name} - $${budgetData.amount.toFixed(2)}` });
    } catch (e) {
      console.error("Error adding budget: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not set budget." });
    }
  }, [user, toast]);

  const updateBudget = useCallback(async (updatedBudgetData: Omit<Budget, 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'>) => {
     if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to update a budget." });
      return;
    }
    const { id, ...dataToUpdate } = updatedBudgetData;
    const budgetPayload = {
      ...dataToUpdate,
      userId: user.uid,
      updatedAt: serverTimestamp(),
    };
    try {
      const budgetDocRef = doc(db, 'users', user.uid, 'budgets', id);
      await updateDoc(budgetDocRef, budgetPayload);
      // Also update in 'budgets_all'
      const allBudgetDocRef = doc(db, 'budgets_all', id);
      await updateDoc(allBudgetDocRef, budgetPayload);
      toast({ title: "Budget Updated" });
    } catch (e) {
      console.error("Error updating budget: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not update budget." });
    }
  }, [user, toast]);

  const deleteBudget = useCallback(async (id: string) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to delete a budget." });
      return;
    }
    try {
      const budgetDocRef = doc(db, 'users', user.uid, 'budgets', id);
      await deleteDoc(budgetDocRef);
      // Also delete from 'budgets_all'
      const allBudgetDocRef = doc(db, 'budgets_all', id);
      await deleteDoc(allBudgetDocRef);
      toast({ title: "Budget Deleted" });
    } catch (e) {
      console.error("Error deleting budget: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not delete budget." });
    }
  }, [user, toast]);

  return (
    <BudgetContextActual.Provider value={{ 
      budgets, 
      addBudget, 
      updateBudget, 
      deleteBudget,
      loadingBudgets,
      allPlatformBudgets: allPlatformBudgetsData,
      loadingAllPlatformBudgets
    }}>
      {children}
    </BudgetContextActual.Provider>
  );
};

export const useBudgets = (): BudgetContextActualType => {
  const context = useContext(BudgetContextActual);
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProviderActual');
  }
  return context;
};

