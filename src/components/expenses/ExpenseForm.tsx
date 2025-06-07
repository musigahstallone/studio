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
import { PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import type { ProcessedExpenseData } from "@/actions/aiActions";

export const ExpenseFormSchema = z.object({
  type: z.enum(["expense", "income"]),
  description: z.string().min(2, { message: "Description must be at least 2 characters." }),
  amount: z.number().positive({ message: "Amount must be positive." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format." }),
  category: z.string().min(1, { message: "Category is required." }), // Will be validated against dynamic list later
  merchant: z.string().optional(),
});

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
  initialData?: Partial<ProcessedExpenseData & {type?: "expense" | "income"}>; // For pre-filling from AI
  formId?: string; // For multiple forms on one page
}

export function ExpenseForm({ onAddExpense, initialData, formId = "expense-form" }: ExpenseFormProps) {
  const { toast } = useToast();
  const [formType, setFormType] = useState<"expense" | "income">(initialData?.type || "expense");

  const form = useForm<z.infer<typeof ExpenseFormSchema>>({
    resolver: zodResolver(ExpenseFormSchema.refine(data => {
        const categories = data.type === 'expense' ? expenseCategories : incomeCategories;
        return categories.includes(data.category as any);
    }, {
        message: "Invalid category for selected type.",
        path: ["category"],
    })),
    defaultValues: {
      type: initialData?.type || "expense",
      description: initialData?.description || "",
      amount: initialData?.amount || 0,
      date: initialData?.date || new Date().toISOString().split("T")[0],
      category: initialData?.category || "",
      merchant: initialData?.merchant || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        type: initialData.type || formType,
        description: initialData.description || "",
        amount: initialData.amount || 0,
        date: initialData.date || new Date().toISOString().split("T")[0],
        category: initialData.category || "",
        merchant: initialData.merchant || "",
      });
      if(initialData.type) setFormType(initialData.type);
    }
  }, [initialData, form, formType]);

  useEffect(() => {
    // Reset category if form type changes and current category is not valid for new type
    const currentCategory = form.getValues("category");
    const categoriesForType = formType === 'expense' ? expenseCategories : incomeCategories;
    if (currentCategory && !categoriesForType.includes(currentCategory as any)) {
      form.setValue("category", "");
    }
  }, [formType, form]);


  function onSubmit(values: z.infer<typeof ExpenseFormSchema>) {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      ...values,
      category: values.category as any, // Zod refine handles validation
    };
    onAddExpense(newExpense);
    toast({
      title: `${formType === 'expense' ? 'Expense' : 'Income'} Added`,
      description: `${values.description} - $${values.amount.toFixed(2)}`,
    });
    form.reset({
        type: formType,
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "",
        merchant: "",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id={formId}>
        <ExpenseFormFields 
            control={form.control} 
            formType={formType} 
            onFormTypeChange={(newType) => {
                setFormType(newType);
                form.setValue("type", newType); // Ensure RHF tracks type change
            }}
        />
        <Button type="submit" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add {formType === "expense" ? "Expense" : "Income"}
        </Button>
      </form>
    </Form>
  );
}
