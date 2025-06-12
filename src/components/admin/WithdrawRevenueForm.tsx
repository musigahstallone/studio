
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useExpenses } from '@/contexts/ExpenseContext'; // To get platformRevenue
import { withdrawPlatformRevenueToAdmin } from '@/actions/adminActions';
import { Loader2, DownloadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, convertToBaseCurrency } from '@/lib/utils';
import { DEFAULT_STORED_CURRENCY } from '@/lib/types';

const withdrawRevenueSchema = z.object({
  amount: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseFloat(String(val))),
    z.number().positive("Withdrawal amount must be positive.")
  ),
  description: z.string().min(5, "Description must be at least 5 characters.").max(100, "Description too long."),
});

type WithdrawRevenueFormData = z.infer<typeof withdrawRevenueSchema>;

interface WithdrawRevenueFormProps {
  onSubmissionDone?: () => void;
}

export function WithdrawRevenueForm({ onSubmissionDone }: WithdrawRevenueFormProps) {
  const { user: adminUser } = useAuth();
  const { platformRevenue, loadingPlatformRevenue } = useExpenses();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPlatformProfitsBase = useMemo(() => {
    return platformRevenue.reduce((sum, entry) => sum + entry.amount, 0); // amount is already base
  }, [platformRevenue]);

  const form = useForm<WithdrawRevenueFormData>({
    resolver: zodResolver(withdrawRevenueSchema),
    defaultValues: {
      amount: undefined,
      description: 'Platform Revenue Payout',
    },
  });
  
  useEffect(() => {
    // Could prefill amount if needed, or just let admin type
  }, [totalPlatformProfitsBase, form]);


  const onSubmit = async (data: WithdrawRevenueFormData) => {
    if (!adminUser?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'Admin not authenticated.' });
      return;
    }
    if (!settingsMounted) {
      toast({ variant: 'destructive', title: 'Error', description: 'Settings not loaded.' });
      return;
    }

    const amountToWithdrawInLocal = data.amount;
    const amountToWithdrawBase = convertToBaseCurrency(amountToWithdrawInLocal, localCurrency);

    if (amountToWithdrawBase > totalPlatformProfitsBase) {
      form.setError('amount', { type: 'manual', message: `Amount exceeds available profits of ${formatCurrency(totalPlatformProfitsBase, displayCurrency)}.` });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await withdrawPlatformRevenueToAdmin(adminUser.uid, amountToWithdrawBase, data.description);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Withdrawal Failed', description: result.error });
      } else if (result.success && result.message) {
        toast({ title: 'Withdrawal Successful!', description: result.message, className: "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400" });
        form.reset({ amount: undefined, description: 'Platform Revenue Payout' });
        if (onSubmissionDone) onSubmissionDone();
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Withdrawal Error', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loadingPlatformRevenue || !settingsMounted) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="ml-3 text-muted-foreground">Loading revenue data...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/30">
          <p className="text-sm font-medium text-foreground">Total Available Platform Profits:</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalPlatformProfitsBase, displayCurrency)}</p>
          <p className="text-xs text-muted-foreground">This is the sum of all penalties and transaction fees collected.</p>
        </div>
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Amount to Withdraw (in {localCurrency})</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || "")} />
              </FormControl>
              <FormDescription className="text-xs">
                The amount you (admin) will receive as income.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Withdrawal Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Monthly platform profit payout" {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting || totalPlatformProfitsBase <= 0}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <DownloadCloud />}
          Confirm Revenue Withdrawal
        </Button>
        {totalPlatformProfitsBase <= 0 && (
            <p className="text-xs text-center text-muted-foreground pt-1">No platform profits available to withdraw.</p>
        )}
      </form>
    </Form>
  );
}
