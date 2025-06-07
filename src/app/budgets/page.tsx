
"use client";

import { useEffect } from 'react'; // For route protection
import { useRouter } from 'next/navigation'; // For route protection

import { AppShell } from '@/components/layout/AppShell';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { useState } from 'react';
import { ResponsiveFormWrapper } from '@/components/shared/ResponsiveFormWrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useBudgets } from '@/contexts/ExpenseContext';
import { useAuth } from '@/contexts/AuthContext';
import { CardTitle, CardDescription } from '@/components/ui/card';


export default function BudgetsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { budgets, addBudget, updateBudget, deleteBudget, loadingBudgets } = useBudgets();
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Partial<Budget> | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleOpenFormForNew = () => {
    setEditingBudget(undefined);
    setIsBudgetFormOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsBudgetFormOpen(true);
  };

  const handleSaveBudget = async (budgetData: Omit<Budget, 'id' | 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'>, id?: string) => {
    if (id) {
      const budgetToUpdateFromState = budgets.find(b => b.id === id);
      if (budgetToUpdateFromState) {
        await updateBudget({ id, ...budgetData });
      }
    } else {
      await addBudget(budgetData);
    }
    setIsBudgetFormOpen(false);
    setEditingBudget(undefined);
  };

  const handleDeleteBudgetCallback = async (id: string) => {
    await deleteBudget(id);
  };


  const formTitle = editingBudget?.id ? "Edit Budget" : "Set New Budget";
  const formDescription = editingBudget?.id 
    ? "Update the details for this budget." 
    : "Define a name and spending limit for a category.";


  if (authLoading || (!user && !authLoading) || loadingBudgets) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading budgets...</p>
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Budgets</h1>
            <Button onClick={handleOpenFormForNew} className="w-full sm:w-auto" disabled={!user}>
                <PlusCircle className="mr-2 h-4 w-4" /> Set New Budget
            </Button>
        </div>
        
        <BudgetList 
          budgets={budgets} 
          onDeleteBudget={handleDeleteBudgetCallback} 
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
