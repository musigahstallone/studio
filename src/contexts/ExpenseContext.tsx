
"use client";

import type { Expense } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

// Consolidated initial mock data
const initialExpensesData: Expense[] = [
  { id: 'exp1', type: 'expense', description: 'Coffee Meeting', amount: 12.50, date: '2024-07-15', category: 'Food & Drink', merchant: 'Cafe Mocha' },
  { id: 'inc1', type: 'income', description: 'July Salary', amount: 2500, date: '2024-07-01', category: 'Salary' },
  { id: 'exp2', type: 'expense', description: 'Groceries', amount: 75.50, date: '2024-07-15', category: 'Groceries', merchant: 'SuperMart' },
  { id: 'exp3', type: 'expense', description: 'Dinner with Friends', amount: 45.00, date: '2024-07-10', category: 'Food & Drink', merchant: 'The Italian Place' },
  { id: 'exp4', type: 'expense', description: 'Gasoline', amount: 50.00, date: '2024-07-05', category: 'Transportation', merchant: 'Gas Station' },
  { id: 'exp5', type: 'expense', description: 'New T-shirt', amount: 29.99, date: '2024-07-18', category: 'Shopping', merchant: 'Fashion Store' },
  { id: 'exp6', type: 'expense', description: 'Movie tickets', amount: 25.00, date: '2024-07-12', category: 'Entertainment', merchant: 'Cineplex' },
  { id: 'inc2', type: 'income', description: 'Freelance Project', amount: 500, date: '2024-07-20', category: 'Salary' },
];


interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (updatedExpense: Expense) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpensesData);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...expenseData,
    };
    setExpenses(prev => [newExpense, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, deleteExpense, updateExpense }}>
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

// This will be moved or created in a separate BudgetContext.tsx file
// For now, adding it here to resolve the import in page.tsx
// In a real app, this should be in its own file: src/contexts/BudgetContext.tsx

import type { Budget } from '@/lib/types'; // Assuming Budget type is defined
// Re-importing useExpenses as useExpenseContextForBudgets to avoid naming conflict
// This is a common pattern if one context depends on data from another or for modularity.

const initialBudgetsState: Budget[] = [
  // Example initial data (can be removed if starting fresh)
  { id: 'b1', name: 'Monthly Food', category: 'Food & Drink', amount: 400, spentAmount: 0 },
  { id: 'b2', name: 'Transport Costs', category: 'Transportation', amount: 150, spentAmount: 0 },
];

interface BudgetContextActualType {
  budgets: Budget[];
  addBudget: (budgetData: Omit<Budget, 'id' | 'spentAmount'>) => void;
  updateBudget: (updatedBudget: Omit<Budget, 'spentAmount'> & { spentAmount?: number }) => void;
  deleteBudget: (id: string) => void;
  // getBudgetSpentAmount: (category: Budget['category']) => number; // Might not be needed if spentAmount is always part of budget object
}

const BudgetContextActual = createContext<BudgetContextActualType | undefined>(undefined);

export const BudgetProviderActual = ({ children }: { children: ReactNode }) => {
  const [budgetsData, setBudgetsData] = useState<Budget[]>(initialBudgetsState);
  const { expenses: allExpenses } = useExpenses(); // Get all expenses to calculate spent amounts

  // Recalculate spent amounts whenever budgetsData or allExpenses change
  const processedBudgets = useMemo(() => {
    return budgetsData.map(budget => {
      const spent = allExpenses
        .filter(e => e.type === 'expense' && e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      return { ...budget, spentAmount: spent };
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [budgetsData, allExpenses]);

  const addBudgetInternal = useCallback((budgetData: Omit<Budget, 'id' | 'spentAmount'>) => {
    const newBudget: Budget = {
      id: crypto.randomUUID(),
      ...budgetData,
      spentAmount: 0, // Will be recalculated by processedBudgets
    };
    setBudgetsData(prev => [...prev, newBudget]);
  }, []);

  const updateBudgetInternal = useCallback((updatedBudgetData: Omit<Budget, 'spentAmount'> & { spentAmount?: number }) => {
    setBudgetsData(prev =>
      prev.map(b => (b.id === updatedBudgetData.id ? { ...b, ...updatedBudgetData, spentAmount: b.spentAmount } : b)) // keep original spentAmount, processedBudgets will update it
    );
  }, []);

  const deleteBudgetInternal = useCallback((id: string) => {
    setBudgetsData(prev => prev.filter(b => b.id !== id));
  }, []);

  return (
    <BudgetContextActual.Provider value={{ 
      budgets: processedBudgets, 
      addBudget: addBudgetInternal, 
      updateBudget: updateBudgetInternal, 
      deleteBudget: deleteBudgetInternal 
    }}>
      {children}
    </BudgetContextActual.Provider>
  );
};

export const useBudgets = (): BudgetContextActualType => {
  const context = useContext(BudgetContextActual);
  if (context === undefined) {
    // This check is important. It ensures that useBudgets is only called
    // from components that are descendants of BudgetProvider.
    throw new Error('useBudgets must be used within a BudgetProviderActual');
  }
  return context;
};

