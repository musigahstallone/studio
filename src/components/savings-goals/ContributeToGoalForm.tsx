
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { SavingsGoal } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { convertToBaseCurrency, formatCurrency } from "@/lib/utils";
import { DollarSign, AlertOctagon } from "lucide-react"; // Added AlertOctagon
import { Textarea } from "@/components/ui/textarea";
import { useExpenses, useBudgets } from "@/contexts/ExpenseContext"; 
import { useEffect, useState, useMemo } from "react";
import { DEFAULT_STORED_CURRENCY } from "@/lib/types";


const ContributeToGoalSchema = z.object({
  contributionAmount: z.preprocess(
    (val) => (val === "" ? undefined : parseFloat(String(val))),
    z.number().positive({ message: "Contribution amount must be positive." })
  ),
  contributionDescription: z.string().optional(),
  fillRemaining: z.boolean().default(false),
});

type ContributeToGoalFormData = z.infer<typeof ContributeToGoalSchema>;

interface ContributeToGoalFormProps {
  goal: SavingsGoal;
  onSaveContribution: (goalId: string, amountInBaseCurrency: number, contributionDescription?: string) => Promise<void>;
  onSubmissionDone?: () => void;
}

const CONVERSION_RATES_FROM_BASE_FOR_DISPLAY: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  KES: 130,
};


export function ContributeToGoalForm({ goal, onSaveContribution, onSubmissionDone }: ContributeToGoalFormProps) {
  const { toast } = useToast();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings();
  const { expenses: userExpenses } = useExpenses(); 
  const { budgets } = useBudgets(); // Get budgets
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const form = useForm<ContributeToGoalFormData>({
    resolver: zodResolver(ContributeToGoalSchema),
    defaultValues: {
      contributionAmount: "" as unknown as number,
      contributionDescription: `Contribution to ${goal.name}`,
      fillRemaining: false,
    },
  });

  const watchFillRemaining = form.watch("fillRemaining");

  const { spendableIncomeForSavings, remainingToReachGoalBase } = useMemo(() => {
    const totalIncome = userExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCurrentSavingsContributions = userExpenses
      .filter(e => e.category === 'Savings' && e.relatedSavingsGoalId !== goal.id) 
      .reduce((sum, e) => sum + e.amount, 0);
    
    const spendable = Math.max(0, totalIncome - totalCurrentSavingsContributions);
    const remainingBase = Math.max(0, goal.targetAmount - goal.currentAmount);
    return { spendableIncomeForSavings: spendable, remainingToReachGoalBase: remainingBase };
  }, [userExpenses, goal.targetAmount, goal.currentAmount, goal.id]);


  useEffect(() => {
    if (watchFillRemaining && settingsMounted && goal.status === 'active' && remainingToReachGoalBase > 0) {
      const rateFromBaseToLocal = 1 / (CONVERSION_RATES_TO_BASE_FOR_DISPLAY[localCurrency] || 1);
      const remainingInLocalCurrency = parseFloat((remainingToReachGoalBase * rateFromBaseToLocal).toFixed(2));
      
      form.setValue("contributionAmount", remainingInLocalCurrency, { shouldValidate: true });
      form.clearErrors("contributionAmount"); 
    } else if (!watchFillRemaining) {
      // form.setValue("contributionAmount", "" as unknown as number); 
    }
  }, [watchFillRemaining, settingsMounted, localCurrency, goal.status, remainingToReachGoalBase, form]);

  const isGoalMetOrInactive = goal.status !== 'active' || remainingToReachGoalBase <= 0;

  async function onSubmit(values: ContributeToGoalFormData) {
    if (!settingsMounted) {
      toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again." });
      return;
    }
    setIsSubmittingForm(true);

    const amountInLocalCurrency = values.contributionAmount;
    const amountInBaseCurrency = convertToBaseCurrency(amountInLocalCurrency, localCurrency);

    if (amountInBaseCurrency <= 0) {
      form.setError("contributionAmount", { type: "manual", message: "Contribution must be greater than zero." });
      setIsSubmittingForm(false);
      return;
    }

    if (amountInBaseCurrency > spendableIncomeForSavings) {
        form.setError("contributionAmount", {type: "manual", message: `Amount exceeds spendable income of ${formatCurrency(spendableIncomeForSavings, displayCurrency)}.`});
        setIsSubmittingForm(false);
        return;
    }
    
    if (!watchFillRemaining) { 
        if ((goal.currentAmount + amountInBaseCurrency) > goal.targetAmount) {
            const maxAllowedContributionBase = goal.targetAmount - goal.currentAmount;
            const rateFromBaseToLocal = 1 / (CONVERSION_RATES_TO_BASE_FOR_DISPLAY[localCurrency] || 1);
            const maxAllowedInLocal = (maxAllowedContributionBase * rateFromBaseToLocal).toFixed(2);

            form.setError("contributionAmount", { 
                type: "manual", 
                message: `Amount exceeds target. Max allowed contribution is ${maxAllowedInLocal} ${localCurrency}.`
            });
            setIsSubmittingForm(false);
            return;
        }
    }

    // Budget warning for 'Savings' category
    const savingsBudget = budgets.find(b => b.category === 'Savings' && b.warnOnExceed);
    if (savingsBudget) {
        // Calculate current spent on 'Savings' category based on allUserExpenses from useExpenses()
        // Note: This is a simplified calculation of current spent. The context's budget object has a `spentAmount`
        // which is more robust. However, for an immediate warning before this specific transaction,
        // this direct calculation might be slightly out of sync if many transactions happened just now
        // without a re-render. For simplicity, we use a local calc here.
        // A more robust way would be to get the savingsBudget.spentAmount and add to it.
        let currentSpentOnSavings = 0;
        userExpenses.filter(e => e.category === 'Savings' && e.type === 'expense')
                    .forEach(e => currentSpentOnSavings += e.amount); // e.amount is already base currency

        const potentialNewSpentOnSavings = currentSpentOnSavings + amountInBaseCurrency;

        if (potentialNewSpentOnSavings > savingsBudget.amount && savingsBudget.amount > 0) {
            const overAmount = potentialNewSpentOnSavings - savingsBudget.amount;
            toast({
                title: "Budget Warning (Savings)",
                description: `This contribution might make you exceed your budget for 'Savings' by ${formatCurrency(overAmount, displayCurrency)}. Budget limit: ${formatCurrency(savingsBudget.amount, displayCurrency)}.`,
                variant: "default",
                duration: 5000,
                action: <AlertOctagon className="text-amber-500" />,
            });
        }
    }

    try {
      await onSaveContribution(goal.id, amountInBaseCurrency, values.contributionDescription);
      form.reset({
        contributionAmount: "" as unknown as number,
        contributionDescription: `Contribution to ${goal.name}`,
        fillRemaining: false, 
      });
      if (onSubmissionDone) {
        onSubmissionDone();
      }
    } catch (error) {
      if (error instanceof Error && error.message !== "Insufficient spendable income to make this contribution." && error.message !== "Goal already achieved." && error.message !== "Contribution too small to process.") {
          toast({
            variant: "destructive",
            title: "Contribution Failed",
            description: error.message || "Could not process contribution."
          });
      }
    } finally {
        setIsSubmittingForm(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {settingsMounted && !isGoalMetOrInactive && (
            <FormField
                control={form.control}
                name="fillRemaining"
                render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) { 
                                form.setValue("contributionAmount", "" as unknown as number, { shouldValidate: true });
                            }
                        }}
                        disabled={isGoalMetOrInactive}
                    />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                        Contribute exact remaining amount to reach goal?
                    </FormLabel>
                    <FormDescription>
                        Automatically fills the amount needed to complete your goal.
                    </FormDescription>
                    </div>
                </FormItem>
                )}
            />
        )}

        <FormField
          control={form.control}
          name="contributionAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribution Amount (in {settingsMounted ? localCurrency : "local currency"})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.00"
                  {...field}
                  value={field.value === undefined || field.value === null || isNaN(field.value as number) ? "" : String(field.value)}
                  onChange={e => {
                    const val = e.target.value;
                    field.onChange(val);
                  }}
                  disabled={watchFillRemaining || isGoalMetOrInactive || !settingsMounted}
                />
              </FormControl>
              <FormDescription className="text-xs space-y-0.5">
                {settingsMounted && !isGoalMetOrInactive && (
                    <span>
                    Remaining to reach goal: {formatCurrency(remainingToReachGoalBase, displayCurrency)}.
                    <br/>
                    </span>
                )}
                 {settingsMounted && (
                    <span>
                    Spendable income for savings: {formatCurrency(spendableIncomeForSavings, displayCurrency)}.
                    </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="contributionDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contribution Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Monthly savings, Bonus allocation"
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                This will be the description for the corresponding transaction record.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={!settingsMounted || isSubmittingForm || isGoalMetOrInactive}>
          <DollarSign className="mr-2 h-4 w-4" />
          {isSubmittingForm ? "Contributing..." : "Add Contribution"}
        </Button>
        {isGoalMetOrInactive && (
            <p className="text-xs text-center text-muted-foreground pt-1">
                This goal is already fully funded or not active for contributions.
            </p>
        )}
      </form>
    </Form>
  );
}

const CONVERSION_RATES_TO_BASE_FOR_DISPLAY: Record<string, number> = {
  USD: 1,
  EUR: 1 / 0.92, 
  KES: 1 / 130,  
};
