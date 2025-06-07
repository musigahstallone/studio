
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";
import { expenseCategories, incomeCategories } from "@/lib/types";
import { ExpenseFormFields } from "./ExpenseFormFields";
import { PlusCircle, Save } from "lucide-react";
import { useState, useEffect } from "react";

// Schema now includes an optional ID for updates
export const ExpenseFormSchema = z.object({
  id: z.string().optional(), // For identifying expense to update
  type: z.enum(["expense", "income"]),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  amount: z.number().positive({ message: "Amount must be positive." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format." }),
  category: z.string().min(1, { message: "Category is required." }),
  merchant: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;

interface ExpenseFormProps {
  onAddExpense: (expenseData: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  initialData?: Partial<Expense>; // Can be full Expense for editing, or ProcessedExpenseData for AI
  formId?: string;
  onSubmissionDone?: () => void; // Callback to clear editing state in parent
}

export function ExpenseForm({ onAddExpense, onUpdateExpense, initialData, formId = "expense-form", onSubmissionDone }: ExpenseFormProps) {
  const { toast } = useToast();
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
      id: initialData?.id || undefined,
      type: initialData?.type || "expense",
      description: initialData?.description || "",
      amount: initialData?.amount || 0,
      date: initialData?.date || new Date().toISOString().split("T")[0],
      category: initialData?.category || "",
      merchant: initialData?.merchant || "",
    },
  });

  useEffect(() => {
    form.reset({
      id: initialData?.id || undefined,
      type: initialData?.type || "expense",
      description: initialData?.description || "",
      amount: initialData?.amount || 0,
      date: initialData?.date || new Date().toISOString().split("T")[0],
      category: initialData?.category || "",
      merchant: initialData?.merchant || "",
    });
    setFormType(initialData?.type || "expense");
  }, [initialData, form]);

  useEffect(() => {
    const currentCategory = form.getValues("category");
    const categoriesForType = formType === 'expense' ? expenseCategories : incomeCategories;
    if (currentCategory && !categoriesForType.includes(currentCategory as any)) {
      form.setValue("category", "");
    }
  }, [formType, form]);

  function onSubmit(values: ExpenseFormData) {
    if (values.id) { // Update existing expense
      const expenseToUpdate: Expense = {
        id: values.id,
        type: values.type,
        description: values.description,
        amount: values.amount,
        date: values.date,
        category: values.category as any, // Zod refine handles validation
        merchant: values.merchant,
      };
      onUpdateExpense(expenseToUpdate);
      toast({
        title: `${formType === 'expense' ? 'Expense' : 'Income'} Updated`,
        description: `${values.description} - $${values.amount.toFixed(2)}`,
      });
    } else { // Add new expense
      const { id, ...expenseData } = values; // Exclude id if present but not for new
      onAddExpense(expenseData as Omit<Expense, 'id'>);
      toast({
        title: `${formType === 'expense' ? 'Expense' : 'Income'} Added`,
        description: `${values.description} - $${values.amount.toFixed(2)}`,
      });
    }
    form.reset({
        type: formType,
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "",
        merchant: "",
        id: undefined,
    });
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
        />
        <Button type="submit" className="w-full sm:w-auto">
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditing ? `Save ${formType}` : `Add ${formType}`}
        </Button>
      </form>
    </Form>
  );
}
