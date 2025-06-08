
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import type { SavingsGoal } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import { Download, AlertTriangle, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { addMonths, isPast, isValid, parseISO, isToday } from "date-fns";
import { useEffect, useState } from "react";

// For this iteration, we assume full withdrawal of currentAmount
const WithdrawFromGoalSchema = z.object({
  withdrawalDescription: z.string().optional(),
  // No amount field for now as we are doing full withdrawal
});

type WithdrawFromGoalFormData = z.infer<typeof WithdrawFromGoalSchema>;

interface WithdrawFromGoalFormProps {
  goal: SavingsGoal;
  onConfirmWithdrawal: (goal: SavingsGoal, amountToWithdraw: number, description?: string) => Promise<void>;
  onSubmissionDone?: () => void;
}

export function WithdrawFromGoalForm({ goal, onConfirmWithdrawal, onSubmissionDone }: WithdrawFromGoalFormProps) {
  const { toast } = useToast();
  const { displayCurrency, isMounted: settingsMounted } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WithdrawFromGoalFormData>({
    resolver: zodResolver(WithdrawFromGoalSchema),
    defaultValues: {
      withdrawalDescription: `Withdrawal from ${goal.name}`,
    },
  });

  let effectiveMaturityDate: Date | null = null;
  if (goal.targetDate) {
    try {
      const tDate = parseISO(goal.targetDate);
      if (isValid(tDate)) effectiveMaturityDate = tDate;
    } catch (e) { /* ignore */ }
  } else if (goal.startDate && goal.durationMonths) {
    try {
      const sDate = parseISO(goal.startDate);
      if (isValid(sDate)) effectiveMaturityDate = addMonths(sDate, goal.durationMonths);
    } catch (e) { /* ignore */ }
  }

  const isActuallyEarly = effectiveMaturityDate ? !isPast(effectiveMaturityDate) && !isToday(effectiveMaturityDate) : false;
  
  let penaltyAmount = 0;
  let netAmountToUser = goal.currentAmount;

  if (isActuallyEarly && goal.allowsEarlyWithdrawal && goal.earlyWithdrawalPenaltyRate > 0) {
    penaltyAmount = goal.currentAmount * goal.earlyWithdrawalPenaltyRate;
    netAmountToUser = goal.currentAmount - penaltyAmount;
  } else if (isActuallyEarly && !goal.allowsEarlyWithdrawal) {
    // This case should ideally be prevented by disabling the withdraw button,
    // but as a safeguard:
    netAmountToUser = 0; // Or handle as an error
  }


  async function onSubmit(values: WithdrawFromGoalFormData) {
    if (!settingsMounted) {
      toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again." });
      return;
    }
    if (isActuallyEarly && !goal.allowsEarlyWithdrawal) {
        toast({variant: "destructive", title: "Withdrawal Blocked", description: "Early withdrawal is not permitted for this goal."});
        return;
    }
    if (goal.currentAmount <= 0) {
        toast({variant: "destructive", title: "No Funds", description: "There are no funds to withdraw from this goal."});
        return;
    }

    setIsSubmitting(true);
    try {
      // For now, we withdraw the full currentAmount
      await onConfirmWithdrawal(goal, goal.currentAmount, values.withdrawalDescription);
      // Toast for success will be handled by the page component
      if (onSubmissionDone) {
        onSubmissionDone();
      }
    } catch (error) {
      // Errors caught by context or page, toast displayed there
      console.error("Withdrawal submission error:", error)
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const canWithdraw = goal.currentAmount > 0 && (!isActuallyEarly || goal.allowsEarlyWithdrawal);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3 p-4 border rounded-md bg-muted/30">
          <h4 className="font-semibold text-foreground">Withdrawal Details for: {goal.name}</h4>
          <p className="text-sm">
            <span className="text-muted-foreground">Current Saved Amount:</span> {settingsMounted ? formatCurrency(goal.currentAmount, displayCurrency) : 'Loading...'}
          </p>
          {effectiveMaturityDate && (
            <p className="text-sm">
                <span className="text-muted-foreground">Maturity Date:</span> {format(effectiveMaturityDate, "PP")}
            </p>
          )}

          {isActuallyEarly && goal.allowsEarlyWithdrawal && (
            <div className="p-3 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold">Early Withdrawal Penalty</p>
                  <p>
                    Penalty Rate: {(goal.earlyWithdrawalPenaltyRate * 100).toFixed(0)}%
                  </p>
                  <p>
                    Penalty Amount: {settingsMounted ? formatCurrency(penaltyAmount, displayCurrency) : 'Calculating...'}
                  </p>
                </div>
              </div>
            </div>
          )}
           {isActuallyEarly && !goal.allowsEarlyWithdrawal && (
             <div className="p-3 rounded-md border border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                    <div>
                        <p className="font-semibold">Early Withdrawal Not Allowed</p>
                        <p>This goal does not permit early withdrawals.</p>
                    </div>
                </div>
            </div>
          )}

          <p className="text-sm font-semibold text-foreground pt-2">
            Net Amount to be Transferred to Income: {settingsMounted ? formatCurrency(netAmountToUser, displayCurrency) : 'Calculating...'}
          </p>
        </div>

        <FormField
          control={form.control}
          name="withdrawalDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`e.g., Withdrew savings from ${goal.name}`}
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This will be the description for the corresponding income transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
            type="submit" 
            className="w-full" 
            disabled={!settingsMounted || isSubmitting || !canWithdraw}
        >
          <Download className="mr-2 h-4 w-4" />
          {isSubmitting ? "Processing..." : "Confirm Full Withdrawal"}
        </Button>
        {!canWithdraw && goal.currentAmount > 0 && (
            <p className="text-xs text-destructive text-center">
                Withdrawal is not currently possible for this goal based on its settings (e.g. early withdrawal not allowed, or not yet mature).
            </p>
        )}
         {!canWithdraw && goal.currentAmount <= 0 && (
            <p className="text-xs text-muted-foreground text-center">
                No funds available to withdraw.
            </p>
        )}

      </form>
    </Form>
  );
}
