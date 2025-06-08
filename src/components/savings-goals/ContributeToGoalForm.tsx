
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
import { useToast } from "@/hooks/use-toast";
import type { SavingsGoal } from "@/lib/types";
import { useSettings } from "@/contexts/SettingsContext";
import { convertToBaseCurrency, formatCurrency } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";


const ContributeToGoalSchema = z.object({
  contributionAmount: z.number().positive({ message: "Contribution amount must be positive." }),
  contributionDescription: z.string().optional(),
});

type ContributeToGoalFormData = z.infer<typeof ContributeToGoalSchema>;

interface ContributeToGoalFormProps {
  goal: SavingsGoal;
  onSaveContribution: (goalId: string, amountInBaseCurrency: number, contributionDescription?: string) => Promise<void>;
  onSubmissionDone?: () => void;
}

export function ContributeToGoalForm({ goal, onSaveContribution, onSubmissionDone }: ContributeToGoalFormProps) {
  const { toast } = useToast();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings();

  const form = useForm<ContributeToGoalFormData>({
    resolver: zodResolver(ContributeToGoalSchema),
    defaultValues: {
      contributionAmount: undefined, // Explicitly undefined for placeholder
      contributionDescription: `Contribution to ${goal.name}`,
    },
  });

  async function onSubmit(values: ContributeToGoalFormData) {
    if (!settingsMounted) {
      toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again." });
      return;
    }

    const amountInBaseCurrency = convertToBaseCurrency(values.contributionAmount, localCurrency);

    if (amountInBaseCurrency <= 0) {
        form.setError("contributionAmount", { type: "manual", message: "Contribution must be greater than zero."});
        return;
    }
    
    // Check if contribution exceeds remaining amount (optional, good UX)
    const remainingNeeded = goal.targetAmount - goal.currentAmount;
    if (amountInBaseCurrency > remainingNeeded && remainingNeeded > 0) {
        // Could confirm with user if they want to over-contribute or cap at remaining.
        // For now, let's allow it but one might adjust this logic.
    }


    await onSaveContribution(goal.id, amountInBaseCurrency, values.contributionDescription);
    
    form.reset();
    if (onSubmissionDone) {
      onSubmissionDone();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  onChange={e => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : parseFloat(val));
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter the amount you want to contribute in your local input currency.
                {settingsMounted && goal.targetAmount > goal.currentAmount && (
                    <>
                    <br/>
                    Remaining to reach goal: {formatCurrency(goal.targetAmount - goal.currentAmount, displayCurrency)}.
                    </>
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
                  placeholder="e.g., Monthly savings, Birthday money"
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This will be the description for the corresponding transaction record.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={!settingsMounted || form.formState.isSubmitting}>
          <DollarSign className="mr-2 h-4 w-4" />
          {form.formState.isSubmitting ? "Contributing..." : "Add Contribution"}
        </Button>
      </form>
    </Form>
  );
}
