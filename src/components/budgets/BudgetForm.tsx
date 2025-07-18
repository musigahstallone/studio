
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Budget } from "@/lib/types";
import { expenseCategories, DEFAULT_STORED_CURRENCY } from "@/lib/types";
import { PlusCircle, Save, AlertOctagon } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { convertToBaseCurrency, formatCurrency, CONVERSION_RATES_FROM_BASE } from "@/lib/utils";
import { useEffect } from "react";


const BudgetFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Budget name is required." }).max(50, { message: "Name must be 50 characters or less." }),
  category: z.string().min(1, { message: "Category is required." }),
  amount: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseFloat(String(val))),
    z.number().positive({ message: "Budget amount must be positive." })
  ),
  warnOnExceed: z.boolean().optional(),
});

type BudgetFormData = z.infer<typeof BudgetFormSchema>;

interface BudgetFormProps {
  onSaveBudget: (budgetData: Omit<Budget, 'id' | 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  existingBudgets: Budget[];
  initialData?: Partial<Budget>;
  onSubmissionDone?: () => void;
}

export function BudgetForm({ onSaveBudget, existingBudgets, initialData, onSubmissionDone }: BudgetFormProps) {
  const { toast } = useToast();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings();
  const isEditing = !!initialData?.id;

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(BudgetFormSchema.refine(data => expenseCategories.includes(data.category as any), {
      message: "Category must be one of the predefined expense categories.",
      path: ["category"],
    })),
    defaultValues: {
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      category: initialData?.category || "",
      amount: undefined, 
      warnOnExceed: initialData?.warnOnExceed || false,
    },
  });

  useEffect(() => {
    let amountForFormDisplay: number | undefined = undefined;
    if (initialData?.amount && settingsMounted && localCurrency !== DEFAULT_STORED_CURRENCY) {
      const rateFromBaseToLocal = CONVERSION_RATES_FROM_BASE[localCurrency];
      if (typeof rateFromBaseToLocal === 'number') {
        amountForFormDisplay = parseFloat((initialData.amount * rateFromBaseToLocal).toFixed(2));
      } else {
        amountForFormDisplay = parseFloat(initialData.amount.toFixed(2));
      }
    } else if (initialData?.amount) {
      amountForFormDisplay = parseFloat(initialData.amount.toFixed(2));
    }

    form.reset({
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      category: initialData?.category || "",
      amount: amountForFormDisplay,
      warnOnExceed: initialData?.warnOnExceed || false,
    });
  }, [initialData, form, settingsMounted, localCurrency]);


  function onSubmit(values: BudgetFormData) {
    if (!settingsMounted) {
      toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again." });
      return;
    }

    if (existingBudgets.some(b => b.name.toLowerCase() === values.name.toLowerCase() && b.id !== values.id)) {
      form.setError("name", { type: "manual", message: "This budget name already exists." });
      return;
    }
    if (existingBudgets.some(b => b.category === values.category && b.id !== values.id)) {
      form.setError("category", { type: "manual", message: "A budget for this category already exists. Edit the existing one or choose a different category." });
      return;
    }

    const amountInBaseCurrency = convertToBaseCurrency(values.amount as number, localCurrency);

    const budgetDataForContext: Omit<Budget, 'id' | 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'> = {
      name: values.name,
      category: values.category as any,
      amount: amountInBaseCurrency,
      warnOnExceed: values.warnOnExceed || false,
    };

    onSaveBudget(budgetDataForContext, values.id);

    toast({
      title: isEditing ? "Budget Updated" : "Budget Set",
      description: `${values.name} (${values.category}): ${formatCurrency(amountInBaseCurrency, displayCurrency)}`,
    });
    form.reset({ name: "", category: "", amount: undefined, id: undefined, warnOnExceed: false });
    if (onSubmissionDone) {
      onSubmissionDone();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Monthly Groceries, Entertainment Fund" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an expense category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      disabled={!isEditing && existingBudgets.some(b => b.category === category)}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Amount (in {settingsMounted ? localCurrency : "local currency"})</FormLabel>
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
              <FormDescription>
                Enter the amount in your selected local input currency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="warnOnExceed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Warn on Exceeding Budget
                </FormLabel>
                <FormDescription>
                  Receive a notification if spending in this category goes over budget.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={!settingsMounted}>
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditing ? "Update Budget" : "Set Budget"}
        </Button>
      </form>
    </Form>
  );
}
