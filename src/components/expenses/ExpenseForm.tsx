
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
import { PlusCircle, Save, AlertOctagon } from "lucide-react"; // Added AlertOctagon
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext"; 
import { useBudgets, useExpenses as useUserExpenses } from "@/contexts/ExpenseContext"; // Renamed useExpenses to avoid conflict
import { convertToBaseCurrency, formatCurrency } from "@/lib/utils"; 

export const ExpenseFormSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["expense", "income"]),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
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
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings(); 
  const { budgets } = useBudgets(); // Get budgets
  const { expenses: allUserExpenses } = useUserExpenses(); // Get all user expenses
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
      amount: 0, 
      date: new Date().toISOString().split("T")[0],
      category: "",
      merchant: "",
      receiptUrl: null,
    },
  });

  useEffect(() => {
    let amountForForm = initialData?.amount || 0;
    if (initialData?.amount && settingsMounted && localCurrency !== DEFAULT_STORED_CURRENCY) {
      const rateFromBaseToLocal = 1 / (CONVERSION_RATES_TO_BASE[localCurrency] || 1); 
      amountForForm = initialData.amount * rateFromBaseToLocal;
    }

    form.reset({
      id: initialData?.id || undefined,
      type: initialData?.type || "expense",
      description: initialData?.description || "",
      amount: parseFloat(amountForForm.toFixed(2)) || 0, 
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

    const amountInBaseCurrency = convertToBaseCurrency(values.amount, localCurrency);

    // Budget warning logic
    if (values.type === 'expense') {
      const relevantBudget = budgets.find(b => b.category === values.category && b.warnOnExceed);
      if (relevantBudget) {
        let currentSpentForCategory = 0;
        // Use allUserExpenses which contains up-to-date amounts directly from Firestore listener in context
        allUserExpenses
          .filter(e => e.category === values.category && e.type === 'expense' && e.id !== initialData?.id)
          .forEach(e => currentSpentForCategory += e.amount); // e.amount is already in base currency

        const potentialNewSpent = currentSpentForCategory + amountInBaseCurrency;
        
        if (potentialNewSpent > relevantBudget.amount && relevantBudget.amount > 0) { // Also check if budget amount is > 0
           const overAmount = potentialNewSpent - relevantBudget.amount;
           toast({
            title: "Budget Warning",
            description: `This transaction might make you exceed your '${relevantBudget.name}' budget for ${relevantBudget.category} by ${formatCurrency(overAmount, displayCurrency)}. Budget limit: ${formatCurrency(relevantBudget.amount, displayCurrency)}.`,
            variant: "default", // Use a non-destructive variant for warnings
            duration: 5000, 
            action: <AlertOctagon className="text-amber-500" />,
          });
        }
      }
    }

    const expensePayloadForStorage = {
      ...values,
      amount: amountInBaseCurrency, 
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
            localCurrencySymbol={settingsMounted ? localCurrency : ""} 
        />
        <Button type="submit" className="w-full" disabled={!settingsMounted}>
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditing ? `Save Changes` : `Add Transaction`}
        </Button>
      </form>
    </Form>
  );
}

const CONVERSION_RATES_TO_BASE: Record<string, number> = {
  USD: 1,
  EUR: 1 / 0.92,
  KES: 1 / 130,
};
