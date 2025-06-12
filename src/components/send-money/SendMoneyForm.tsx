
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { verifyRecipientByTransactionTag, sendMoneyP2P } from '@/actions/p2pActions';
import { Loader2, CheckCircle, AlertCircle, UserCheck, Send, ShieldQuestion, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency, calculateTransactionCost, convertToBaseCurrency } from '@/lib/utils';
import { DEFAULT_STORED_CURRENCY } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

const sendMoneySchema = z.object({
  recipientTag: z.string().min(6, "Transaction Tag must be at least 6 characters.").max(12, "Tag too long."),
  amount: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseFloat(String(val))),
    z.number().positive("Amount must be positive.")
  ),
  description: z.string().max(100, "Description too long.").optional(),
});

type SendMoneyFormData = z.infer<typeof sendMoneySchema>;

export function SendMoneyForm() {
  const { user } = useAuth();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientUid, setRecipientUid] = useState<string | null>(null); 
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [urlProvidedRecipientName, setUrlProvidedRecipientName] = useState<string | null>(null);

  const form = useForm<SendMoneyFormData>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      recipientTag: '',
      amount: undefined,
      description: '',
    },
  });

  const watchedAmount = form.watch('amount');
  const amountInBase = watchedAmount && localCurrency ? convertToBaseCurrency(watchedAmount, localCurrency) : 0;
  const estimatedFeeBase = amountInBase > 0 ? calculateTransactionCost(amountInBase) : 0;
  const totalDeductionBase = amountInBase + estimatedFeeBase;

  const handleVerifyRecipient = useCallback(async (tagToVerify?: string) => {
    const tag = tagToVerify || form.getValues('recipientTag');
    if (!tag) {
      form.setError('recipientTag', { type: 'manual', message: 'Recipient Tag is required.' });
      return;
    }
    setIsVerifying(true);
    setVerificationError(null);
    setRecipientName(null); 
    setRecipientUid(null);
    try {
      const result = await verifyRecipientByTransactionTag(tag);
      if (result.error) {
        setVerificationError(result.error);
        toast({ variant: 'destructive', title: 'Verification Failed', description: result.error });
      } else if (result.recipientName && result.recipientUid) {
        if (result.recipientUid === user?.uid) {
             setVerificationError("You cannot send money to yourself.");
             toast({ variant: 'destructive', title: 'Verification Failed', description: "You cannot send money to yourself."});
        } else {
            setRecipientName(result.recipientName); 
            setRecipientUid(result.recipientUid);
            toast({ title: 'Recipient Verified', description: `Found user: ${result.recipientName}` });
        }
      }
    } catch (e: any) {
      setVerificationError(e.message || 'Failed to verify recipient.');
      toast({ variant: 'destructive', title: 'Verification Error', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsVerifying(false);
    }
  }, [form, toast, user?.uid]);

  const resetRecipientState = useCallback(() => {
    setRecipientName(null);
    setRecipientUid(null);
    setVerificationError(null);
    setUrlProvidedRecipientName(null);
    form.setValue('recipientTag', '');
    // Potentially clear URL params if we want to avoid re-triggering useEffect
    // For now, just clearing form state.
  }, [form]);
  
  useEffect(() => {
    const tagFromUrl = searchParams.get('toTag');
    const nameFromUrl = searchParams.get('recipientName');

    if (tagFromUrl) {
      form.setValue('recipientTag', tagFromUrl, { shouldValidate: false }); // Set without immediate validation
      if (nameFromUrl) {
        setUrlProvidedRecipientName(decodeURIComponent(nameFromUrl));
      }
      // Automatically trigger verification only if the tag is new or no recipient is verified
      if (tagFromUrl !== form.getValues('recipientTag') || !recipientName) { 
        handleVerifyRecipient(tagFromUrl);
      }
    }
  }, [searchParams, form, recipientName, handleVerifyRecipient]);


  const onSubmit = async (data: SendMoneyFormData) => {
    if (!recipientName || !recipientUid) {
      toast({ variant: 'destructive', title: 'Cannot Send', description: 'Please verify recipient first.' });
      return;
    }
     if (recipientUid === user?.uid) {
        toast({ variant: 'destructive', title: 'Cannot Send', description: 'You cannot send money to yourself.'});
        return;
    }
    setShowConfirmation(true); 
  };

  const handleConfirmSend = async () => {
    if (!user || !recipientName || !recipientUid || !localCurrency) {
      toast({ variant: 'destructive', title: 'Error', description: 'Missing required information.' });
      return;
    }
    setIsSending(true);
    const data = form.getValues();
    try {
      const result = await sendMoneyP2P(user.uid, data.recipientTag, data.amount, localCurrency, data.description);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Transfer Failed', description: result.error });
      } else if (result.success && result.message) {
        toast({ title: 'Transfer Successful!', description: result.message, className: "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400" });
        form.reset();
        resetRecipientState();
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Transfer Error', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsSending(false);
      setShowConfirmation(false);
    }
  };
  
  if (!settingsMounted) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="recipientTag"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Recipient&apos;s Transaction Tag</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="e.g., A1b2C3d4" {...field} disabled={isVerifying || (!!recipientName && !!searchParams.get('toTag'))} />
                </FormControl>
                {!recipientName && (
                  <Button type="button" onClick={() => handleVerifyRecipient()} disabled={isVerifying || !field.value}>
                    {isVerifying ? <Loader2 className="animate-spin" /> : <UserCheck />}
                    Verify
                  </Button>
                )}
                {recipientName && (
                   <Button type="button" variant="outline" onClick={resetRecipientState}>
                    <XCircle className="mr-2"/> Clear
                  </Button>
                )}
              </div>
              <FormMessage />
              {verificationError && <p className="text-xs text-destructive mt-1">{verificationError}</p>}
            </FormItem>
          )}
        />

        {urlProvidedRecipientName && !recipientName && !isVerifying && !verificationError && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-500/50 p-3 rounded-md">
                <div className="flex items-center gap-2">
                    <ShieldQuestion className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Verifying recipient <span className="font-semibold">{urlProvidedRecipientName}</span> (Tag: {form.getValues('recipientTag')})...
                    </p>
                </div>
            </Card>
        )}

        {recipientName && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-500/50 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Verified Recipient: <span className="font-semibold">{recipientName}</span>
              </p>
            </div>
          </Card>
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Amount (in {localCurrency})</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  {...field} 
                  value={field.value === undefined || field.value === null || isNaN(field.value as number) ? "" : String(field.value)}
                  onChange={e => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : parseFloat(val));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Note (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., For lunch, Birthday gift" {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedAmount > 0 && recipientName && (
            <Card className="bg-muted/50 p-3 rounded-md text-xs">
                <CardDescription>
                    <p>Amount to send: {formatCurrency(amountInBase, displayCurrency)}</p>
                    <p>Estimated transaction fee: {formatCurrency(estimatedFeeBase, displayCurrency)}</p>
                    <p className="font-semibold">Total to be deducted: {formatCurrency(totalDeductionBase, displayCurrency)}</p>
                </CardDescription>
            </Card>
        )}

        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <AlertDialogTrigger asChild>
                <Button type="submit" className="w-full" disabled={isVerifying || isSending || !recipientName || !form.formState.isValid}>
                  {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                  Send Money
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
                <AlertDialogDescription>
                    You are about to send <span className="font-semibold">{formatCurrency(amountInBase, displayCurrency)}</span> (plus a fee of <span className="font-semibold">{formatCurrency(estimatedFeeBase, displayCurrency)}</span>, totaling <span className="font-semibold">{formatCurrency(totalDeductionBase, displayCurrency)}</span>) to <span className="font-semibold">{recipientName}</span>.
                    <br/><br/>
                    Description: {form.getValues('description') || "N/A"}
                    <br/><br/>
                    This action cannot be undone. Are you sure?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSend} disabled={isSending} className="bg-primary hover:bg-primary/90">
                    {isSending ? <Loader2 className="animate-spin mr-2"/> : null}
                    Yes, Send Money
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </form>
    </Form>
  );
}
