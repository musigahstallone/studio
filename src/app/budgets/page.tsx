
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { useState, useMemo } from 'react';
import { useExpenses } from '@/contexts/ExpenseContext';
import { ResponsiveFormWrapper } from '@/components/shared/ResponsiveFormWrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const initialBudgetsData: Budget[] = [
  // Example initial data (can be removed if starting fresh)
  // { id: 'b1', name: 'Monthly Food', category: 'Food & Drink', amount: 400, spentAmount: 0 },
  // { id: 'b2', name: 'Transport Costs', category: 'Transportation', amount: 150, spentAmount: 0 },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgetsData);
  const { expenses } = useExpenses(); 
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Partial<Budget> | undefined>(undefined);

  const handleOpenFormForNew = () => {
    setEditingBudget(undefined);
    setIsBudgetFormOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsBudgetFormOpen(true);
  };

  const handleSaveBudget = (budget: Budget) => {
    setBudgets(prev => {
      const index = prev.findIndex(b => b.id === budget.id);
      if (index > -1) {
        const updatedBudgets = [...prev];
        updatedBudgets[index] = budget;
        return updatedBudgets;
      }
      // When adding a new budget, ensure its spentAmount is initialized correctly
      // (it should already be passed from BudgetForm based on existing expenses or 0)
      return [budget, ...prev].sort((a,b) => (a.name || "").localeCompare(b.name || ""));
    });
    setIsBudgetFormOpen(false);
    setEditingBudget(undefined);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const budgetsWithSpentAmounts = useMemo(() => {
    return budgets.map(budget => {
      const spent = expenses
        .filter(e => e.type === 'expense' && e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      return { ...budget, spentAmount: spent };
    }).sort((a,b) => (a.name || "").localeCompare(b.name || ""));
  }, [budgets, expenses]);

  const formTitle = editingBudget?.id ? "Edit Budget" : "Set New Budget";
  const formDescription = editingBudget?.id 
    ? "Update the details for this budget." 
    : "Define a name and spending limit for a category.";

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Budgets</h1>
            <Button onClick={handleOpenFormForNew} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Set New Budget
            </Button>
        </div>
        
        <BudgetList 
          budgets={budgetsWithSpentAmounts} 
          onDeleteBudget={handleDeleteBudget} 
          onEditBudget={handleEditBudget} 
        />

        <ResponsiveFormWrapper
          isOpen={isBudgetFormOpen}
          onOpenChange={setIsBudgetFormOpen}
          title={formTitle}
          description={formDescription}
          side="right"
        >
          <BudgetForm 
            onSaveBudget={handleSaveBudget} 
            existingBudgets={budgets} 
            initialData={editingBudget}
            onSubmissionDone={() => {
              setIsBudgetFormOpen(false);
              setEditingBudget(undefined);
            }}
          />
        </ResponsiveFormWrapper>
      </div>
    </AppShell>
  );
}
