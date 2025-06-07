
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { useState } from 'react';
import { ResponsiveFormWrapper } from '@/components/shared/ResponsiveFormWrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useBudgets } from '@/contexts/ExpenseContext'; // Changed to use the combined context for now

export default function BudgetsPage() {
  // Budgets state and logic are now managed by useBudgets hook
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
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

  const handleSaveBudget = (budgetData: Omit<Budget, 'id' | 'spentAmount'>, id?: string) => {
    if (id) {
      // This is an update
      const budgetToUpdate = budgets.find(b => b.id === id);
      if (budgetToUpdate) {
        updateBudget({ ...budgetToUpdate, ...budgetData });
      }
    } else {
      // This is an add
      addBudget(budgetData);
    }
    setIsBudgetFormOpen(false);
    setEditingBudget(undefined);
  };

  const handleDeleteBudgetCallback = (id: string) => {
    deleteBudget(id);
  };


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
          budgets={budgets} // budgets from context already include spentAmount
          onDeleteBudget={handleDeleteBudgetCallback} 
          onEditBudget={handleEditBudget} 
        />

        <ResponsiveFormWrapper
          isOpen={isBudgetFormOpen}
          onOpenChange={setIsBudgetFormOpen}
          title={formTitle}
          description={formDescription}
          side="right" // For desktop sheet
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
