
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
import { DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useExpenses } from "@/contexts/ExpenseContext"; // To calculate available income
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

// Conversion rates for display purposes within the component
const CONVERSION_RATES_FROM_BASE_FOR_DISPLAY: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  KES: 130,
};


export function ContributeToGoalForm({ goal, onSaveContribution, onSubmissionDone }: ContributeToGoalFormProps) {
  const { toast } = useToast();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings();
  const { expenses: userExpenses } = useExpenses(); // For spendable income calculation

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
      .filter(e => e.category === 'Savings' && e.relatedSavingsGoalId !== goal.id) // Exclude contributions to *this* goal for spendable calc
      .reduce((sum, e) => sum + e.amount, 0);
    
    const spendable = Math.max(0, totalIncome - totalCurrentSavingsContributions);
    const remainingBase = Math.max(0, goal.targetAmount - goal.currentAmount);
    return { spendableIncomeForSavings: spendable, remainingToReachGoalBase: remainingBase };
  }, [userExpenses, goal.targetAmount, goal.currentAmount, goal.id]);


  useEffect(() => {
    if (watchFillRemaining && settingsMounted && goal.status === 'active' && remainingToReachGoalBase > 0) {
      // Convert remainingToReachGoalBase (which is in DEFAULT_STORED_CURRENCY) to localCurrency for form input
      const rateFromBaseToLocal = 1 / (CONVERSION_RATES_TO_BASE_FOR_DISPLAY[localCurrency] || 1);
      const remainingInLocalCurrency = parseFloat((remainingToReachGoalBase * rateFromBaseToLocal).toFixed(2));
      
      form.setValue("contributionAmount", remainingInLocalCurrency, { shouldValidate: true });
      form.clearErrors("contributionAmount"); // Clear previous errors
    } else if (!watchFillRemaining) {
      // Allow user to clear or type if not filling remaining
      // form.setValue("contributionAmount", "" as unknown as number); // Clears when unchecked
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
    
    if (!watchFillRemaining) { // Only apply this check if user is manually inputting
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


    try {
      await onSaveContribution(goal.id, amountInBaseCurrency, values.contributionDescription);
      form.reset({
        contributionAmount: "" as unknown as number,
        contributionDescription: `Contribution to ${goal.name}`,
        fillRemaining: false, // Reset checkbox
      });
      if (onSubmissionDone) {
        onSubmissionDone();
      }
    } catch (error) {
      // Specific error toasts are handled by the context, but generic ones can be here too
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
                            if (!checked) { // When unchecking
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

// Helper for form's internal display logic if localCurrency isn't USD
// Ensure this matches or is derived from your main util if more complex conversions are needed
const CONVERSION_RATES_TO_BASE_FOR_DISPLAY: Record<string, number> = {
  USD: 1,
  EUR: 1 / 0.92, // 1 EUR = 1/0.92 USD
  KES: 1 / 130,  // 1 KES = 1/130 USD
};


    