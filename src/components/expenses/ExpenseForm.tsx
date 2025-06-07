
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";
import { expenseCategories, incomeCategories, DEFAULT_STORED_CURRENCY } from "@/lib/types";
import { ExpenseFormFields } from "./ExpenseFormFields";
import { PlusCircle, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext"; // Import useSettings
import { convertToBaseCurrency, formatCurrency } from "@/lib/utils"; // Import conversion and formatting utils

export const ExpenseFormSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["expense", "income"]),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  // Amount entered by user in their localCurrency
  amount: z.number().positive({ message: "Amount must be positive." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format." }),
  category: z.string().min(1, { message: "Category is required." }),
  merchant: z.string().optional(),
  receiptUrl: z.string().url().optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;

interface ExpenseFormProps {
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  initialData?: Partial<Expense>;
  formId?: string;
  onSubmissionDone?: () => void;
}

export function ExpenseForm({ onAddExpense, onUpdateExpense, initialData, formId = "expense-form", onSubmissionDone }: ExpenseFormProps) {
  const { toast } = useToast();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings(); // Get localCurrency and displayCurrency
  const [formType, setFormType] = useState<"expense" | "income">(initialData?.type || "expense");
  const isEditing = !!initialData?.id;

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(ExpenseFormSchema.refine(data => {
        const categories = data.type === 'expense' ? expenseCategories : incomeCategories;
        return categories.includes(data.category as any);
    }, {
        message: "Invalid category for selected type.",
        path: ["category"],
    })),
    defaultValues: {
      id: undefined,
      type: "expense",
      description: "",
      amount: 0, // This will be interpreted as being in localCurrency by the user
      date: new Date().toISOString().split("T")[0],
      category: "",
      merchant: "",
      receiptUrl: null,
    },
  });

  useEffect(() => {
    // When initialData (from AI or editing) is provided, its 'amount' is in DEFAULT_STORED_CURRENCY.
    // We need to convert it TO localCurrency for display in the form input.
    let amountForForm = initialData?.amount || 0;
    if (initialData?.amount && settingsMounted && localCurrency !== DEFAULT_STORED_CURRENCY) {
      // Convert stored base currency amount to local currency for form input display
      // This requires converting from base (e.g. USD) to local (e.g. KES)
      // formatCurrency utility does this: it takes base, converts to target (localCurrency here), and formats
      // We just need the raw converted number for the form.
      const rateFromBaseToLocal = 1 / (CONVERSION_RATES_TO_BASE[localCurrency] || 1); // Crude way to get rate from base TO local
      amountForForm = initialData.amount * rateFromBaseToLocal;
    }


    form.reset({
      id: initialData?.id || undefined,
      type: initialData?.type || "expense",
      description: initialData?.description || "",
      amount: parseFloat(amountForForm.toFixed(2)) || 0, // Display in local currency
      date: initialData?.date || new Date().toISOString().split("T")[0],
      category: initialData?.category || "",
      merchant: initialData?.merchant || "",
      receiptUrl: initialData?.receiptUrl || null,
    });
    setFormType(initialData?.type || "expense");
  }, [initialData, form, settingsMounted, localCurrency]);

  useEffect(() => {
    const currentCategory = form.getValues("category");
    const categoriesForType = formType === 'expense' ? expenseCategories : incomeCategories;
    if (currentCategory && !categoriesForType.includes(currentCategory as any)) {
      form.setValue("category", "");
    }
  }, [formType, form]);

  function onSubmit(values: ExpenseFormData) {
    if (!settingsMounted) {
        toast({ variant: "destructive", title: "Error", description: "Settings not loaded yet. Please try again."});
        return;
    }

    // Convert amount from localCurrency (user input) to DEFAULT_STORED_CURRENCY for saving
    const amountInBaseCurrency = convertToBaseCurrency(values.amount, localCurrency);

    const expensePayloadForStorage = {
      ...values,
      amount: amountInBaseCurrency, // Store converted amount
    };

    const { id, ...dataForContext } = expensePayloadForStorage;

    if (isEditing && initialData?.id) {
      const expenseToUpdate: Expense = {
        ...(initialData as Expense),
        ...dataForContext,
        id: initialData.id,
      };
      onUpdateExpense(expenseToUpdate);
      toast({
        title: `${formType === 'expense' ? 'Transaction' : 'Income'} Updated`,
        description: `${values.description} - ${formatCurrency(amountInBaseCurrency, displayCurrency)}`,
      });
    } else {
      onAddExpense(dataForContext as Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
      toast({
        title: `${formType === 'expense' ? 'Transaction' : 'Income'} Added`,
        description: `${values.description} - ${formatCurrency(amountInBaseCurrency, displayCurrency)}`,
      });
    }
    form.reset({
        type: "expense",
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "",
        merchant: "",
        id: undefined,
        receiptUrl: null,
    });
    setFormType("expense");
    if (onSubmissionDone) {
        onSubmissionDone();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id={formId}>
        <ExpenseFormFields
            control={form.control}
            formType={formType}
            onFormTypeChange={(newType) => {
                setFormType(newType);
                form.setValue("type", newType);
            }}
            localCurrencySymbol={settingsMounted ? localCurrency : ""} // Pass local currency symbol or code
        />
        <Button type="submit" className="w-full" disabled={!settingsMounted}>
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditing ? `Save Changes` : `Add Transaction`}
        </Button>
      </form>
    </Form>
  );
}

// Temporary placeholder, replace with actual calculation if needed for form.reset
const CONVERSION_RATES_TO_BASE: Record<string, number> = {
  USD: 1,
  EUR: 1 / 0.92,
  KES: 1 / 130,
};
