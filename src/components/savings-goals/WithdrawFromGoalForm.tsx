
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
import { Download, AlertTriangle, Info, TrendingDown, TrendingUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { addMonths, isPast, isValid, parseISO, isToday, format } from "date-fns";
import { useEffect, useState, useMemo } from "react";
import { DEFAULT_STORED_CURRENCY } from "@/lib/types"; // Import DEFAULT_STORED_CURRENCY

const WithdrawFromGoalSchema = z.object({
  withdrawalDescription: z.string().optional(),
});

type WithdrawFromGoalFormData = z.infer<typeof WithdrawFromGoalSchema>;

interface WithdrawFromGoalFormProps {
  goal: SavingsGoal;
  onConfirmWithdrawal: (goal: SavingsGoal, amountToWithdraw: number, description?: string) => Promise<void>;
  onSubmissionDone?: () => void;
}

// Replicated from context for display purposes - ensure this stays in sync or is imported if moved to utils
const calculateTransactionCostForDisplay = (withdrawalAmount: number): number => {
  const minCost = 0.50; // USD
  const maxCost = 15.00; // USD
  let cost = 0;

  if (withdrawalAmount <= 0) return 0;

  if (withdrawalAmount <= 200) { // Assuming 200 USD threshold
    cost = withdrawalAmount * 0.01; 
  } else if (withdrawalAmount <= 1000) { // Assuming 1000 USD threshold
    cost = 2.00 + (withdrawalAmount - 200) * 0.005; 
  } else {
    cost = 2.00 + (800 * 0.005) + (withdrawalAmount - 1000) * 0.0025;
  }

  cost = Math.max(minCost, cost);
  cost = Math.min(maxCost, cost);
  return parseFloat(cost.toFixed(2));
};


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

  const {
    isActuallyEarly,
    calculatedPenaltyOnTarget,
    calculatedTransactionCost,
    actualPenaltyCollected,
    actualTransactionCostCollected,
    netAmountToUser,
    effectiveMaturityDate,
    isWithdrawalPossible,
    disableReason,
  } = useMemo(() => {
    let early = true; 
    let maturityDate: Date | null = null;
    const isFunded = goal.currentAmount >= goal.targetAmount;

    if (goal.withdrawalCondition === 'targetAmountReached' && isFunded) {
        early = false;
    } else {
        if (goal.targetDate) {
            try {
                const tDate = parseISO(goal.targetDate);
                if (isValid(tDate)) {
                    maturityDate = tDate;
                    if (isPast(tDate) || isToday(tDate)) {
                        early = false;
                    }
                }
            } catch (e) { console.error("Error parsing targetDate for early check in form:", e); }
        } else if (goal.startDate && goal.durationMonths) {
            try {
                const sDate = parseISO(goal.startDate);
                if (isValid(sDate)) {
                    maturityDate = addMonths(sDate, goal.durationMonths);
                    if (isPast(maturityDate) || isToday(maturityDate)) {
                        early = false;
                    }
                }
            } catch (e) { console.error("Error parsing startDate/duration for early check in form:", e); }
        }
    }

    const penaltyRate = goal.earlyWithdrawalPenaltyRate;
    const penaltyOnTarget = early && goal.allowsEarlyWithdrawal && penaltyRate > 0
                           ? goal.targetAmount * penaltyRate
                           : 0;
    
    const grossAmountToWithdraw = goal.currentAmount; 
    const transactionCost = calculateTransactionCostForDisplay(grossAmountToWithdraw);

    let penaltyCollected = 0;
    let costCollected = 0;
    let netToUser = 0;

    if (penaltyOnTarget >= grossAmountToWithdraw) {
        penaltyCollected = grossAmountToWithdraw;
        costCollected = 0;
        netToUser = 0;
    } else {
        penaltyCollected = penaltyOnTarget;
        const remainingAfterPenalty = grossAmountToWithdraw - penaltyCollected;
        if (transactionCost >= remainingAfterPenalty) {
            costCollected = remainingAfterPenalty;
            netToUser = 0;
        } else {
            costCollected = transactionCost;
            netToUser = remainingAfterPenalty - costCollected;
        }
    }
    
    const finalNetAmountToUser = Math.max(0, netToUser);
    let possible = true;
    let reason = null;

    if (goal.currentAmount <= 0) {
        possible = false;
        reason = "No funds available to withdraw.";
    } else if (early && !goal.allowsEarlyWithdrawal) {
        possible = false;
        reason = "Early withdrawal is not permitted for this goal.";
    } else if (finalNetAmountToUser <= 0 && goal.currentAmount > 0) { // Only show this reason if there were funds to begin with
        possible = false;
        reason = "Withdrawal not allowed as the net amount after deductions would be zero or less.";
    }
    
    return {
        isActuallyEarly: early,
        calculatedPenaltyOnTarget: penaltyOnTarget,
        calculatedTransactionCost: transactionCost,
        actualPenaltyCollected: Math.max(0, penaltyCollected),
        actualTransactionCostCollected: Math.max(0, costCollected),
        netAmountToUser: finalNetAmountToUser,
        effectiveMaturityDate: maturityDate,
        isWithdrawalPossible: possible,
        disableReason: reason,
    };
  }, [goal]);


  async function onSubmit(values: WithdrawFromGoalFormData) {
    if (!settingsMounted || !isWithdrawalPossible) {
      if (!settingsMounted) {
          toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again." });
      } else if (disableReason) {
          toast({ variant: "destructive", title: "Withdrawal Blocked", description: disableReason });
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onConfirmWithdrawal(goal, goal.currentAmount, values.withdrawalDescription);
      if (onSubmissionDone) {
        onSubmissionDone();
      }
    } catch (error) {
      console.error("Withdrawal submission error:", error)
      // Error toast might be handled by context, or add a generic one here if not caught
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3 p-4 border rounded-md bg-card shadow-sm">
          <h4 className="font-semibold text-foreground">Withdrawal Details: {goal.name}</h4>
          
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Current Saved Amount:</span> {settingsMounted ? formatCurrency(goal.currentAmount, displayCurrency) : 'Loading...'}
            </p>
            {effectiveMaturityDate && (
              <p>
                  <span className="text-muted-foreground">Target/Maturity Date:</span> {format(effectiveMaturityDate, "PP")}
              </p>
            )}
             <p>
                <span className="text-muted-foreground">Status:</span> {isActuallyEarly ? 'Early Withdrawal' : 'Mature Withdrawal'}
            </p>
          </div>

          {(isActuallyEarly && goal.allowsEarlyWithdrawal && calculatedPenaltyOnTarget > 0) && (
            <div className="p-3 my-2 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm space-y-1">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="font-semibold">Early Withdrawal Penalty</p>
                  <p>Based on Target: {settingsMounted ? formatCurrency(goal.targetAmount, displayCurrency) : '...'} at {(goal.earlyWithdrawalPenaltyRate * 100).toFixed(0)}%</p>
                  <p>Calculated Penalty: <span className="font-medium">{settingsMounted ? formatCurrency(calculatedPenaltyOnTarget, displayCurrency) : '...'}</span></p>
                  <p>Actual Penalty Applied: <span className="font-medium">{settingsMounted ? formatCurrency(actualPenaltyCollected, displayCurrency) : '...'}</span></p>
                </div>
              </div>
            </div>
          )}
           {isActuallyEarly && !goal.allowsEarlyWithdrawal && (
             <div className="p-3 my-2 rounded-md border border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                    <div>
                        <p className="font-semibold">Early Withdrawal Not Allowed</p>
                        <p>This goal does not permit early withdrawals.</p>
                    </div>
                </div>
            </div>
          )}

          {calculatedTransactionCost > 0 && (
            <div className="p-3 my-2 rounded-md border border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm space-y-1">
                 <div className="flex items-start">
                    <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
                    <div>
                        <p className="font-semibold">Transaction Cost</p>
                        <p>Calculated Cost: <span className="font-medium">{settingsMounted ? formatCurrency(calculatedTransactionCost, displayCurrency) : '...'}</span></p>
                        <p>Actual Cost Applied: <span className="font-medium">{settingsMounted ? formatCurrency(actualTransactionCostCollected, displayCurrency) : '...'}</span></p>
                    </div>
                </div>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <p className="text-sm font-semibold text-foreground mt-2">
                Summary of Funds:
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-1">
                <div className="text-muted-foreground">Gross Amount from Goal:</div>
                <div className="text-right font-medium">{settingsMounted ? formatCurrency(goal.currentAmount, displayCurrency) : '...'}</div>

                {actualPenaltyCollected > 0 && (
                  <>
                    <div className="text-muted-foreground flex items-center"><TrendingDown className="mr-1 text-red-500 h-4 w-4"/>Penalty:</div>
                    <div className="text-right font-medium text-red-600 dark:text-red-400">-{settingsMounted ? formatCurrency(actualPenaltyCollected, displayCurrency) : '...'}</div>
                  </>
                )}
                 {actualTransactionCostCollected > 0 && (
                  <>
                    <div className="text-muted-foreground flex items-center"><TrendingDown className="mr-1 text-orange-500 h-4 w-4"/>Transaction Cost:</div>
                    <div className="text-right font-medium text-orange-600 dark:text-orange-400">-{settingsMounted ? formatCurrency(actualTransactionCostCollected, displayCurrency) : '...'}</div>
                  </>
                )}
                <div className="text-muted-foreground font-bold pt-1 border-t col-span-2 mt-1"></div>
                <div className="text-muted-foreground font-bold flex items-center"><TrendingUp className="mr-1 text-green-500 h-4 w-4"/>Net Amount to Your Income:</div>
                <div className="text-right font-bold text-green-600 dark:text-green-400">{settingsMounted ? formatCurrency(netAmountToUser, displayCurrency) : '...'}</div>
            </div>
          </div>
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
                This will be the description for the corresponding income transaction (if net amount is positive).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
            type="submit" 
            className="w-full" 
            disabled={!settingsMounted || isSubmitting || !isWithdrawalPossible}
        >
          <Download className="mr-2 h-4 w-4" />
          {isSubmitting ? "Processing..." : "Confirm Full Withdrawal"}
        </Button>
        {!isWithdrawalPossible && settingsMounted && disableReason && (
            <p className="text-xs text-destructive text-center pt-1">{disableReason}</p>
        )}
      </form>
    </Form>
  );
}
