
"use client";

import type { Expense } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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
