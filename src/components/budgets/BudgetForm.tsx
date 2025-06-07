
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
import { useToast } from "@/hooks/use-toast";
import type { Budget } from "@/lib/types";
import { expenseCategories, DEFAULT_STORED_CURRENCY } from "@/lib/types";
import { PlusCircle, Save } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext"; // Import useSettings
import { convertToBaseCurrency, formatCurrency } from "@/lib/utils"; // Import conversion utils
import { useEffect } from "react";


const BudgetFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Budget name is required." }).max(50, { message: "Name must be 50 characters or less."}),
  category: z.string().min(1, { message: "Category is required." }),
  // Amount entered by user in their localCurrency
  amount: z.number().positive({ message: "Budget amount must be positive." }),
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
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings(); // Get localCurrency
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
      amount: initialData?.amount || 0, // This will be interpreted as localCurrency by user
    },
  });

  useEffect(() => {
    let amountForForm = initialData?.amount || 0;
    if (initialData?.amount && settingsMounted && localCurrency !== DEFAULT_STORED_CURRENCY) {
      // Convert stored base currency amount to local currency for form input display
      const rateFromBaseToLocal = 1 / (CONVERSION_RATES_TO_BASE_BUDGET[localCurrency] || 1);
      amountForForm = initialData.amount * rateFromBaseToLocal;
    }

    form.reset({
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      category: initialData?.category || "",
      amount: parseFloat(amountForForm.toFixed(2)) || 0,
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

    // Convert amount from localCurrency (user input) to DEFAULT_STORED_CURRENCY
    const amountInBaseCurrency = convertToBaseCurrency(values.amount, localCurrency);

    const budgetDataForContext: Omit<Budget, 'id' | 'userId' | 'spentAmount' | 'createdAt' | 'updatedAt'> = {
      name: values.name,
      category: values.category as any,
      amount: amountInBaseCurrency, // Store converted amount
    };

    onSaveBudget(budgetDataForContext, values.id);

    toast({
      title: isEditing ? "Budget Updated" : "Budget Set",
      description: `${values.name} (${values.category}): ${formatCurrency(amountInBaseCurrency, displayCurrency)}`,
    });
    form.reset({ name: "", category: "", amount: 0, id: undefined });
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
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "") {
                        field.onChange(val);
                      } else {
                        const num = parseFloat(val);
                        field.onChange(isNaN(num) ? val : num);
                      }
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
        <Button type="submit" className="w-full" disabled={!settingsMounted}>
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditing ? "Update Budget" : "Set Budget"}
        </Button>
      </form>
    </Form>
  );
}

// Temporary placeholder, replace with actual calculation if needed for form.reset
const CONVERSION_RATES_TO_BASE_BUDGET: Record<string, number> = {
  USD: 1,
  EUR: 1 / 0.92,
  KES: 1 / 130,
};
