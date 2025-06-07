
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { useState } from 'react';
import { useExpenses } from '@/contexts/ExpenseContext'; // Import useExpenses

// Mock initial data for budgets
const initialBudgets: Budget[] = [
  { id: 'b1', category: 'Food & Drink', amount: 400, spentAmount: 0 },
  { id: 'b2', category: 'Transportation', amount: 150, spentAmount: 0 },
  { id: 'b3', category: 'Shopping', amount: 200, spentAmount: 0 },
  { id: 'b4', category: 'Groceries', amount: 300, spentAmount: 0 },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const { expenses } = useExpenses(); // Get expenses from context

  const handleAddOrUpdateBudget = (budget: Budget) => {
    setBudgets(prev => {
      const index = prev.findIndex(b => b.id === budget.id);
      if (index > -1) {
        const updatedBudgets = [...prev];
        updatedBudgets[index] = budget;
        return updatedBudgets;
      }
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
        {/* Pass live expenses to BudgetList */}
        <BudgetList budgets={budgets} expenses={expenses} onDeleteBudget={handleDeleteBudget} />
      </div>
    </AppShell>
  );
}
