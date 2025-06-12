
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
// Note: AppShell is now used by the parent page.tsx for Suspense fallback consistency
import { SavingsGoalList } from '@/components/savings-goals/SavingsGoalList';
import { SavingsGoalForm } from '@/components/savings-goals/SavingsGoalForm';
import { ContributeToGoalForm } from '@/components/savings-goals/ContributeToGoalForm';
import { WithdrawFromGoalForm } from '@/components/savings-goals/WithdrawFromGoalForm';
import type { SavingsGoal } from '@/lib/types';
import { useSavingsGoals } from '@/contexts/SavingsGoalContext';
import { ResponsiveFormWrapper } from '@/components/shared/ResponsiveFormWrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SavingsGoalsClientPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeToGoal, withdrawFromGoal, loadingSavingsGoals } = useSavingsGoals();
  const { toast } = useToast();

  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Partial<SavingsGoal> | undefined>(undefined);

  const [isContributeFormOpen, setIsContributeFormOpen] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<SavingsGoal | null>(null);

  const [isWithdrawFormOpen, setIsWithdrawFormOpen] = useState(false);
  const [selectedGoalForWithdrawal, setSelectedGoalForWithdrawal] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    // Auth check now primarily handled by AppShell, but keep client-side check as fallback/local logic
    if (!authLoading && !user) {
      // AppShell should handle the redirect, but this is a safeguard
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleOpenGoalFormForNew = () => {
    setEditingGoal(undefined);
    setIsGoalFormOpen(true);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleSaveGoal = async (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'>, id?: string) => {
    if (id) {
      await updateSavingsGoal({ id, ...goalData });
    } else {
      await addSavingsGoal(goalData);
    }
    setIsGoalFormOpen(false);
    setEditingGoal(undefined);
  };

  const handleDeleteGoalCallback = async (id: string) => {
    await deleteSavingsGoal(id);
  };

  const handleOpenContributeForm = (goal: SavingsGoal) => {
    setSelectedGoalForContribution(goal);
    setIsContributeFormOpen(true);
  };

  const handleSaveContribution = async (goalId: string, amountInBaseCurrency: number, contributionDescription?: string) => {
    if (!selectedGoalForContribution) return;
    try {
      await contributeToGoal(goalId, amountInBaseCurrency, contributionDescription);
      toast({
        title: "Contribution Successful",
        description: `Added funds to "${selectedGoalForContribution.name}".`
      });
      setIsContributeFormOpen(false);
      setSelectedGoalForContribution(null);
    } catch (error) {
      if (error instanceof Error && error.message !== "Insufficient spendable income to make this contribution." && error.message !== "Goal already achieved." && error.message !== "Contribution too small to process.") {
          toast({
            variant: "destructive",
            title: "Contribution Failed",
            description: error.message || "Could not process contribution."
          });
      }
    }
  };

  const handleOpenWithdrawForm = (goal: SavingsGoal) => {
    setSelectedGoalForWithdrawal(goal);
    setIsWithdrawFormOpen(true);
  };

  const handleConfirmWithdrawal = async (goalToWithdraw: SavingsGoal, withdrawalAmount: number, withdrawalDescription?: string) => {
    try {
      await withdrawFromGoal(goalToWithdraw, withdrawalAmount, withdrawalDescription);
      toast({
        title: "Withdrawal Successful",
        description: `Funds processed from "${goalToWithdraw.name}".`
      });
      setIsWithdrawFormOpen(false);
      setSelectedGoalForWithdrawal(null);
    } catch (error) {
       if (error instanceof Error && error.message !== "Early withdrawal is not allowed for this goal." && error.message !== "Invalid withdrawal amount." && error.message !== "Insufficient funds in goal.") {
        toast({
            variant: "destructive",
            title: "Withdrawal Failed",
            description: error.message || "Could not process withdrawal."
        });
      }
    }
  };


  const goalFormTitle = editingGoal?.id ? "Edit Savings Goal" : "Create New Savings Goal";
  const goalFormDescription = editingGoal?.id
    ? "Update the details for this savings goal."
    : "Define a new goal to start saving towards.";

  // Loading state within the client component, AppShell handles initial page load suspense
  if (authLoading || (!user && !authLoading) || loadingSavingsGoals) {
    // This loader will show if these specific conditions are met *after* Suspense resolves
    // or if Suspense is not used higher up for these specific data fetches.
    // The primary page-level loader is now the Suspense fallback.
    return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground text-sm md:text-base">Loading your savings goals...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="font-headline text-2xl md:text-3xl font-semibold text-foreground">Savings Goals</h1>
        <Button onClick={handleOpenGoalFormForNew} className="w-full sm:w-auto" disabled={!user}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Goal
        </Button>
      </div>

      <SavingsGoalList
        savingsGoals={savingsGoals}
        onDeleteGoal={handleDeleteGoalCallback}
        onEditGoal={handleEditGoal}
        onContributeToGoal={handleOpenContributeForm}
        onWithdrawFromGoal={handleOpenWithdrawForm}
      />

      <ResponsiveFormWrapper
        isOpen={isGoalFormOpen}
        onOpenChange={setIsGoalFormOpen}
        title={goalFormTitle}
        description={goalFormDescription}
        side="right"
      >
        <SavingsGoalForm
          onSaveGoal={handleSaveGoal}
          existingGoals={savingsGoals}
          initialData={editingGoal}
          onSubmissionDone={() => {
            setIsGoalFormOpen(false);
            setEditingGoal(undefined);
          }}
        />
      </ResponsiveFormWrapper>

      {selectedGoalForContribution && (
        <ResponsiveFormWrapper
          isOpen={isContributeFormOpen}
          onOpenChange={(isOpen) => {
            setIsContributeFormOpen(isOpen);
            if (!isOpen) setSelectedGoalForContribution(null);
          }}
          title={`Contribute to: ${selectedGoalForContribution.name}`}
          description={`Current amount: ${selectedGoalForContribution.currentAmount.toFixed(2)} / Target: ${selectedGoalForContribution.targetAmount.toFixed(2)} (base currency).`}
          side="right"
        >
          <ContributeToGoalForm
            goal={selectedGoalForContribution}
            onSaveContribution={handleSaveContribution}
            onSubmissionDone={() => {
              setIsContributeFormOpen(false);
              setSelectedGoalForContribution(null);
            }}
          />
        </ResponsiveFormWrapper>
      )}

      {selectedGoalForWithdrawal && (
        <ResponsiveFormWrapper
          isOpen={isWithdrawFormOpen}
          onOpenChange={(isOpen) => {
            setIsWithdrawFormOpen(isOpen);
            if (!isOpen) setSelectedGoalForWithdrawal(null);
          }}
          title={`Withdraw from: ${selectedGoalForWithdrawal.name}`}
          description="Review details and confirm withdrawal."
          side="right"
        >
          <WithdrawFromGoalForm
            goal={selectedGoalForWithdrawal}
            onConfirmWithdrawal={handleConfirmWithdrawal}
            onSubmissionDone={() => {
              setIsWithdrawFormOpen(false);
              setSelectedGoalForWithdrawal(null);
            }}
          />
        </ResponsiveFormWrapper>
      )}
    </div>
  );
}
