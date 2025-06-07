
"use client";

import type { Expense, Budget } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
// import { db, auth } from '@/lib/firebase'; // Step 1: Import Firebase
// import { collection, addDoc, deleteDoc, updateDoc, query, where, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
// import { useAuthState } from 'react-firebase-hooks/auth'; // For real auth

// --- Mocking current user for demonstration ---
// In a real app, this would come from Firebase Auth context
const MOCK_CURRENT_USER_ID = "user1_mock";
// --- End Mocking ---

// Consolidated initial mock data - now with userId
const initialExpensesData: Expense[] = [
  { id: 'exp1', userId: 'user1_mock', type: 'expense', description: 'Coffee Meeting', amount: 12.50, date: '2024-07-15', category: 'Food & Drink', merchant: 'Cafe Mocha' },
  { id: 'inc1', userId: 'user1_mock', type: 'income', description: 'July Salary', amount: 2500, date: '2024-07-01', category: 'Salary' },
  { id: 'exp2', userId: 'user1_mock', type: 'expense', description: 'Groceries', amount: 75.50, date: '2024-07-15', category: 'Groceries', merchant: 'SuperMart' },
  { id: 'exp_other_user1', userId: 'user2_mock', type: 'expense', description: 'Electronics Store', amount: 199.99, date: '2024-07-16', category: 'Shopping', merchant: 'Tech World' },
  { id: 'exp3', userId: 'user1_mock', type: 'expense', description: 'Dinner with Friends', amount: 45.00, date: '2024-07-10', category: 'Food & Drink', merchant: 'The Italian Place' },
  { id: 'exp4', userId: 'user1_mock', type: 'expense', description: 'Gasoline', amount: 50.00, date: '2024-07-05', category: 'Transportation', merchant: 'Gas Station' },
  { id: 'exp_other_user2', userId: 'user2_mock', type: 'income', description: 'Consulting Gig', amount: 750, date: '2024-07-18', category: 'Salary' },
  { id: 'exp5', userId: 'user1_mock', type: 'expense', description: 'New T-shirt', amount: 29.99, date: '2024-07-18', category: 'Shopping', merchant: 'Fashion Store' },
  { id: 'exp6', userId: 'user1_mock', type: 'expense', description: 'Movie tickets', amount: 25.00, date: '2024-07-12', category: 'Entertainment', merchant: 'Cineplex' },
  { id: 'inc2', userId: 'user1_mock', type: 'income', description: 'Freelance Project', amount: 500, date: '2024-07-20', category: 'Salary' },
];

const initialBudgetsState: Budget[] = [
  { id: 'b1', userId: 'user1_mock', name: 'Monthly Food', category: 'Food & Drink', amount: 400, spentAmount: 0 },
  { id: 'b2', userId: 'user1_mock', name: 'Transport Costs', category: 'Transportation', amount: 150, spentAmount: 0 },
  { id: 'b_other_user1', userId: 'user2_mock', name: 'User2 Entertainment', category: 'Entertainment', amount: 200, spentAmount: 0 },
];


interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (updatedExpense: Omit<Expense, 'userId'>) => void;
  allPlatformExpenses: Expense[]; // For admin view
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  // const [authUser, authLoading, authError] = useAuthState(auth); // For real auth
  // const currentUserId = authUser?.uid || MOCK_CURRENT_USER_ID; // Use real UID if available

  // For demonstration, we use MOCK_CURRENT_USER_ID.
  // In a real app, 'expensesData' would be fetched from Firestore based on currentUserId.
  const [allExpensesData, setAllExpensesData] = useState<Expense[]>(initialExpensesData);

  // Filter expenses for the "current user"
  const userExpenses = useMemo(() => {
    return allExpensesData.filter(e => e.userId === MOCK_CURRENT_USER_ID)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpensesData]);

  // Placeholder for fetching expenses from Firestore - would replace useState(initialExpensesData)
  // useEffect(() => {
  //   if (!currentUserId) return;
  //   console.log(`Firebase: Subscribing to expenses for user ${currentUserId}`);
  //   const q = query(collection(db, 'expenses'), where('userId', '==', currentUserId));
  //   const unsubscribe = onSnapshot(q, (querySnapshot) => {
  //     const userExpensesFromDb: Expense[] = [];
  //     querySnapshot.forEach((doc) => {
  //       userExpensesFromDb.push({ id: doc.id, ...doc.data() } as Expense);
  //     });
  //     setAllExpensesData(prev => [...prev.filter(e => e.userId !== MOCK_CURRENT_USER_ID), ...userExpensesFromDb]); // Merge or replace logic
  //   });
  //   return () => unsubscribe();
  // }, [currentUserId]);


  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    const newExpense: Expense = {
        id: crypto.randomUUID(), // Firestore would generate ID
        userId: MOCK_CURRENT_USER_ID,
        ...expenseData,
    };
    // Local state update (simulating optimistic update)
    setAllExpensesData(prev => [newExpense, ...prev]);
    console.log(`Firebase (simulated): Would add expense to Firestore for user ${MOCK_CURRENT_USER_ID}:`, newExpense);
    // try {
    //   const docRef = await addDoc(collection(db, 'expenses'), { ...newExpense, createdAt: serverTimestamp() });
    //   console.log("Expense added with ID: ", docRef.id);
    // } catch (e) {
    //   console.error("Error adding expense: ", e);
    //   // Revert optimistic update if needed
    //   setAllExpensesData(prev => prev.filter(exp => exp.id !== newExpense.id));
    // }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    // Local state update
    setAllExpensesData(prev => prev.filter(e => e.id !== id));
    console.log(`Firebase (simulated): Would delete expense ${id} from Firestore for user ${MOCK_CURRENT_USER_ID}`);
    // try {
    //   await deleteDoc(doc(db, 'expenses', id));
    //   console.log("Expense deleted: ", id);
    // } catch (e) {
    //   console.error("Error deleting expense: ", e);
    //   // Revert if needed
    // }
  }, []);

  const updateExpense = useCallback(async (updatedExpenseData: Omit<Expense, 'userId'>) => {
     const expenseWithUser: Expense = { ...updatedExpenseData, userId: MOCK_CURRENT_USER_ID };
    // Local state update
    setAllExpensesData(prev => prev.map(e => e.id === expenseWithUser.id ? expenseWithUser : e));
    console.log(`Firebase (simulated): Would update expense ${expenseWithUser.id} in Firestore for user ${MOCK_CURRENT_USER_ID}:`, updatedExpenseData);
    // try {
    //   await updateDoc(doc(db, 'expenses', updatedExpenseData.id), updatedExpenseData);
    //   console.log("Expense updated: ", updatedExpenseData.id);
    // } catch (e) {
    //   console.error("Error updating expense: ", e);
    //   // Revert if needed
    // }
  }, []);

  return (
    <ExpenseContext.Provider value={{ 
      expenses: userExpenses, 
      addExpense, 
      deleteExpense, 
      updateExpense,
      allPlatformExpenses: allExpensesData // For admin dashboard
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
  addBudget: (budgetData: Omit<Budget, 'id' | 'userId' | 'spentAmount'>) => void;
  updateBudget: (updatedBudget: Omit<Budget, 'userId' | 'spentAmount'> & { spentAmount?: number }) => void;
  deleteBudget: (id: string) => void;
  allPlatformBudgets: Budget[]; // For admin view
}

const BudgetContextActual = createContext<BudgetContextActualType | undefined>(undefined);

export const BudgetProviderActual = ({ children }: { children: ReactNode }) => {
  // const [authUser] = useAuthState(auth); // For real auth
  // const currentUserId = authUser?.uid || MOCK_CURRENT_USER_ID;

  const [allBudgetsData, setAllBudgetsData] = useState<Budget[]>(initialBudgetsState);
  const { allPlatformExpenses } = useExpenses(); // Get all expenses to calculate spent amounts

  // Filter budgets for the "current user" and calculate spent amounts
  const userBudgets = useMemo(() => {
    return allBudgetsData
      .filter(b => b.userId === MOCK_CURRENT_USER_ID)
      .map(budget => {
        const spent = allPlatformExpenses // Use all expenses for calculation, then filter for user
          .filter(e => e.userId === MOCK_CURRENT_USER_ID && e.type === 'expense' && e.category === budget.category)
          .reduce((sum, e) => sum + e.amount, 0);
        return { ...budget, spentAmount: spent };
      }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [allBudgetsData, allPlatformExpenses]);
  
  // For Admin: All budgets with their correct spent amounts
  const allProcessedPlatformBudgets = useMemo(() => {
    return allBudgetsData.map(budget => {
      const spent = allPlatformExpenses
        .filter(e => e.userId === budget.userId && e.type === 'expense' && e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      return { ...budget, spentAmount: spent };
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [allBudgetsData, allPlatformExpenses]);


  const addBudgetInternal = useCallback(async (budgetData: Omit<Budget, 'id' | 'userId' | 'spentAmount'>) => {
    const newBudget: Budget = {
      id: crypto.randomUUID(), // Firestore would generate ID
      userId: MOCK_CURRENT_USER_ID,
      ...budgetData,
      spentAmount: 0, // Will be recalculated by processedBudgets
    };
    // Local state update
    setAllBudgetsData(prev => [...prev, newBudget]);
    console.log(`Firebase (simulated): Would add budget to Firestore for user ${MOCK_CURRENT_USER_ID}:`, newBudget);
    // Real Firestore call would be here
  }, []);

  const updateBudgetInternal = useCallback(async (updatedBudgetData: Omit<Budget, 'userId' | 'spentAmount'> & { spentAmount?: number }) => {
    const budgetWithUser = { ...updatedBudgetData, userId: MOCK_CURRENT_USER_ID, spentAmount: updatedBudgetData.spentAmount ?? 0 };
     // Local state update
    setAllBudgetsData(prev =>
      prev.map(b => (b.id === budgetWithUser.id ? { ...b, ...budgetWithUser } : b))
    );
    console.log(`Firebase (simulated): Would update budget ${budgetWithUser.id} in Firestore for user ${MOCK_CURRENT_USER_ID}:`, budgetWithUser);
    // Real Firestore call would be here
  }, []);

  const deleteBudgetInternal = useCallback(async (id: string) => {
    // Local state update
    setAllBudgetsData(prev => prev.filter(b => b.id !== id));
    console.log(`Firebase (simulated): Would delete budget ${id} from Firestore for user ${MOCK_CURRENT_USER_ID}`);
    // Real Firestore call would be here
  }, []);

  return (
    <BudgetContextActual.Provider value={{ 
      budgets: userBudgets, 
      addBudget: addBudgetInternal, 
      updateBudget: updateBudgetInternal, 
      deleteBudget: deleteBudgetInternal,
      allPlatformBudgets: allProcessedPlatformBudgets // For admin view
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
