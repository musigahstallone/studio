"use client";

import { AppShell } from '@/components/layout/AppShell';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget, Expense } from '@/lib/types';
import { useState } from 'react';

// Mock initial data
const initialBudgets: Budget[] = [
  { id: 'b1', category: 'Food & Drink', amount: 400, spentAmount: 0 },
  { id: 'b2', category: 'Transportation', amount: 150, spentAmount: 0 },
  { id: 'b3', category: 'Shopping', amount: 200, spentAmount: 0 },
];

// Assume expenses are managed globally or passed down; for now, mock some relevant ones
const mockExpenses: Expense[] = [
    { id: 'e1', type: 'expense', description: 'Groceries', amount: 75.50, date: '2024-07-15', category: 'Groceries', merchant: 'SuperMart' },
    { id: 'e2', type: 'expense', description: 'Dinner', amount: 45.00, date: '2024-07-10', category: 'Food & Drink', merchant: 'The Italian Place' },
    { id: 'e3', type: 'expense', description: 'Gas', amount: 50.00, date: '2024-07-05', category: 'Transportation', merchant: 'Gas Station' },
    { id: 'e4', type: 'expense', description: 'New T-shirt', amount: 29.99, date: '2024-07-18', category: 'Shopping', merchant: 'Fashion Store' },
];


export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  // In a real app, expenses would come from a shared state/store or API
  const [expenses] = useState<Expense[]>(mockExpenses); 

  const handleAddOrUpdateBudget = (budget: Budget) => {
    setBudgets(prev => {
      const index = prev.findIndex(b => b.id === budget.id);
      if (index > -1) {
        // Update existing
        const updatedBudgets = [...prev];
        updatedBudgets[index] = budget;
        return updatedBudgets;
      }
      // Add new
      return [budget, ...prev];
    });
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Budgets</h1>
        <BudgetForm onAddOrUpdateBudget={handleAddOrUpdateBudget} existingBudgets={budgets} />
        <BudgetList budgets={budgets} expenses={expenses} onDeleteBudget={handleDeleteBudget} />
      </div>
    </AppShell>
  );
}
