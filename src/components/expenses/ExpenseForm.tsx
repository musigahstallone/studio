
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

// Schema now matches the data structure expected by Firestore add/update functions in context
// id, userId, createdAt, updatedAt are handled by the context
export const ExpenseFormSchema = z.object({
  id: z.string().optional(), // Only present for updates
  type: z.enum(["expense", "income"]),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  amount: z.number().positive({ message: "Amount must be positive." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format." }),
  category: z.string().min(1, { message: "Category is required." }),
  merchant: z.string().optional(),
  receiptUrl: z.string().url().optional().nullable(), // Add receiptUrl
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;

interface ExpenseFormProps {
  // These now expect the full Expense object without system-managed fields
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateExpense: (expense: Expense) => void; // Expects full Expense object for update
  initialData?: Partial<Expense>; 
  formId?: string;
  onSubmissionDone?: () => void; 
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
    form.reset({
      id: initialData?.id || undefined,
      type: initialData?.type || "expense",
      description: initialData?.description || "",
      amount: initialData?.amount || 0,
      date: initialData?.date || new Date().toISOString().split("T")[0],
      category: initialData?.category || "",
      merchant: initialData?.merchant || "",
      receiptUrl: initialData?.receiptUrl || null,
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
    // Remove id from values if it's not an edit, as Firestore generates it
    const { id, ...dataForContext } = values;

    if (isEditing && initialData?.id) { 
      // For update, we need to pass the full initialData structure + form changes
      // The context's updateExpense expects an object that includes the ID.
      const expenseToUpdate: Expense = {
        ...(initialData as Expense), // Base with original id, userId, timestamps
        ...dataForContext, // Overlay with form values
        id: initialData.id, // Ensure ID is present
      };
      onUpdateExpense(expenseToUpdate);
      toast({
        title: `${formType === 'expense' ? 'Transaction' : 'Income'} Updated`,
        description: `${values.description} - $${values.amount.toFixed(2)}`,
      });
    } else { 
      // For add, pass data without id. userId, createdAt, updatedAt are handled by context.
      onAddExpense(dataForContext as Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
      toast({
        title: `${formType === 'expense' ? 'Transaction' : 'Income'} Added`,
        description: `${values.description} - $${values.amount.toFixed(2)}`,
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
        />
        {/* You might want to add a hidden field for receiptUrl if it's part of the form explicitly */}
        {/* <FormField control={form.control} name="receiptUrl" render={({ field }) => <Input type="hidden" {...field} />} /> */}
        <Button type="submit" className="w-full">
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditing ? `Save Changes` : `Add Transaction`}
        </Button>
      </form>
    </Form>
  );
}
