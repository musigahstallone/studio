
"use client";

import type { Expense, Budget, PlatformRevenueEntry } from '@/lib/types';
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
  getDocs,
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { useAuth } from './AuthContext'; 
import { useToast } from '@/hooks/use-toast';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'receiptUrl'>, receiptUrl?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (updatedExpense: Partial<Expense> & { id: string }) => Promise<void>; 
  loadingExpenses: boolean;
  allPlatformExpenses: Expense[]; 
  loadingAllPlatformExpenses: boolean;
  platformRevenue: PlatformRevenueEntry[];
  loadingPlatformRevenue: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [allPlatformExpenses, setAllPlatformExpenses] = useState<Expense[]>([]);
  const [loadingAllPlatformExpenses, setLoadingAllPlatformExpenses] = useState(true);
  const [platformRevenue, setPlatformRevenue] = useState<PlatformRevenueEntry[]>([]);
  const [loadingPlatformRevenue, setLoadingPlatformRevenue] = useState(true);


  useEffect(() => {
    if (authLoading) {
      setLoadingExpenses(true);
      setLoadingAllPlatformExpenses(true);
      setLoadingPlatformRevenue(true);
      return;
    }

    let unsubscribeUserExpenses: (() => void) | undefined;
    if (user?.uid) {
      setLoadingExpenses(true);
      const expensesCol = collection(db, 'users', user.uid, 'expenses');
      const qUserExpenses = query(expensesCol, orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
      
      unsubscribeUserExpenses = onSnapshot(qUserExpenses, (querySnapshot) => {
        const userExpensesFromDb: Expense[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userExpensesFromDb.push({ 
            id: doc.id, 
            ...data,
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
      setExpenses([]); 
      setLoadingExpenses(false);
    }

    // Fetch all platform expenses (for admin)
    setLoadingAllPlatformExpenses(true);
    const allExpensesQuery = query(collection(db, 'expenses_all'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
    const unsubscribeAllExpenses = onSnapshot(allExpensesQuery, (snapshot) => {
        const platformExpensesData: Expense[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            platformExpensesData.push({
                 id: doc.id,
                 ...data,
                 date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString().split('T')[0] : data.date as string,
                 createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
                 updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate().toISOString() : undefined,
            } as Expense);
        });
        setAllPlatformExpenses(platformExpensesData);
        setLoadingAllPlatformExpenses(false);
    }, (error) => {
        console.error("Error fetching all platform expenses: ", error);
        setAllPlatformExpenses([]); 
        setLoadingAllPlatformExpenses(false);
    });

    // Fetch platform revenue entries
    setLoadingPlatformRevenue(true);
    const platformRevenueQuery = query(collection(db, 'platformRevenue'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
    const unsubscribePlatformRevenue = onSnapshot(platformRevenueQuery, (snapshot) => {
        const revenueEntries: PlatformRevenueEntry[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            revenueEntries.push({
                id: doc.id,
                ...data,
                date: (data.date as Timestamp)?.toDate ? (data.date as Timestamp).toDate().toISOString().split('T')[0] : data.date as string,
                createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
            } as PlatformRevenueEntry);
        });
        setPlatformRevenue(revenueEntries);
        setLoadingPlatformRevenue(false);
    }, (error) => {
        console.error("Error fetching platform revenue: ", error);
        setPlatformRevenue([]);
        setLoadingPlatformRevenue(false);
    });


    return () => {
      if (unsubscribeUserExpenses) unsubscribeUserExpenses();
      unsubscribeAllExpenses();
      unsubscribePlatformRevenue();
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
      
      // Also add to expenses_all collection, ensuring the ID is consistent
      const allExpensesCol = collection(db, 'expenses_all');
      await setDoc(doc(allExpensesCol, docRef.id), { 
          ...newExpensePayload, 
          id: docRef.id // Explicitly set the ID for the expenses_all document
      });

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
      
      const allExpenseDocRef = doc(db, 'expenses_all', id); 
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
    const { id, createdAt, userId, updatedAt, ...dataToUpdate } = updatedExpenseData;

    const payloadForUserDoc: Record<string, any> = {
      ...dataToUpdate, 
      updatedAt: serverTimestamp(),
    };
    
    if (updatedExpenseData.hasOwnProperty('receiptUrl')) {
      payloadForUserDoc.receiptUrl = updatedExpenseData.receiptUrl === undefined ? null : updatedExpenseData.receiptUrl;
    }

    try {
      const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
      await updateDoc(expenseDocRef, payloadForUserDoc); 
      
      const existingUserExpenseSnap = await getDoc(expenseDocRef);
      const existingUserExpenseData = existingUserExpenseSnap.data();

      const payloadForAllDoc: Record<string, any> = {
        ...dataToUpdate,
        id: id, 
        userId: existingUserExpenseData?.userId || user.uid, 
        updatedAt: serverTimestamp(), 
        createdAt: existingUserExpenseData?.createdAt || serverTimestamp(), 
        receiptUrl: payloadForUserDoc.receiptUrl, 
        amount: dataToUpdate.amount ?? existingUserExpenseData?.amount,
        category: dataToUpdate.category ?? existingUserExpenseData?.category,
        date: dataToUpdate.date ?? existingUserExpenseData?.date,
        description: dataToUpdate.description ?? existingUserExpenseData?.description,
        merchant: dataToUpdate.merchant ?? existingUserExpenseData?.merchant,
        type: dataToUpdate.type ?? existingUserExpenseData?.type,
        relatedSavingsGoalId: dataToUpdate.relatedSavingsGoalId ?? existingUserExpenseData?.relatedSavingsGoalId,
      };
      
      Object.keys(payloadForAllDoc).forEach(key => {
        if (payloadForAllDoc[key] === undefined) {
          delete payloadForAllDoc[key];
        }
      });

      const allExpenseDocRef = doc(db, 'expenses_all', id);
      await setDoc(allExpenseDocRef, payloadForAllDoc, { merge: true }); 
      
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
      allPlatformExpenses, 
      loadingAllPlatformExpenses,
      platformRevenue,
      loadingPlatformRevenue
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
  const { expenses, loadingExpenses, allPlatformExpenses, loadingAllPlatformExpenses } = useExpenses(); 
  const { toast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [allPlatformBudgetsData, setAllPlatformBudgetsData] = useState<Budget[]>([]);
  const [loadingAllPlatformBudgets, setLoadingAllPlatformBudgets] = useState(true);


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
        
        const processedBudgets = userBudgetsFromDb.map(budget => {
            const spent = expenses 
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

    setLoadingAllPlatformBudgets(true);
    const allBudgetsQuery = query(collection(db, 'budgets_all'), orderBy('name')); 
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
      
      await setDoc(doc(collection(db, 'budgets_all'), docRef.id), { ...newBudgetPayload, id: docRef.id });
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
      await updateDoc(budgetDocRef, { ...dataToUpdate, updatedAt: serverTimestamp() }); 
      
      const allBudgetDocRef = doc(db, 'budgets_all', id);
      await setDoc(allBudgetDocRef, budgetPayload, { merge: true }); 
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
