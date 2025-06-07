
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { expenseCategories } from "@/lib/types"; 
import { PlusCircle } from "lucide-react";

const BudgetFormSchema = z.object({
  id: z.string().optional(), // For identifying budget to update
  category: z.string().min(1, { message: "Category is required." }),
  amount: z.number().positive({ message: "Budget amount must be positive." }),
});

type BudgetFormData = z.infer<typeof BudgetFormSchema>;

interface BudgetFormProps {
  onSaveBudget: (budget: Budget) => void;
  existingBudgets: Budget[]; 
  initialData?: Partial<Budget>;
  onSubmissionDone?: () => void;
}

export function BudgetForm({ onSaveBudget, existingBudgets, initialData, onSubmissionDone }: BudgetFormProps) {
  const { toast } = useToast();
  const isEditing = !!initialData?.id;

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      category: initialData?.category || "",
      amount: initialData?.amount || 0,
    },
  });

  function onSubmit(values: BudgetFormData) {
    const existingBudgetForCategory = existingBudgets.find(b => b.category === values.category);
    
    const budgetToSave: Budget = {
      id: values.id || existingBudgetForCategory?.id || crypto.randomUUID(),
      category: values.category as any, 
      amount: values.amount,
      spentAmount: existingBudgetForCategory ? existingBudgetForCategory.spentAmount : 0, 
    };

    onSaveBudget(budgetToSave);
    toast({
      title: isEditing || existingBudgetForCategory ? "Budget Updated" : "Budget Set",
      description: `${values.category}: $${values.amount.toFixed(2)}`,
    });
    form.reset({ category: "", amount: 0, id: undefined });
    if (onSubmissionDone) {
      onSubmissionDone();
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isEditing} // Prevent changing category when editing for simplicity
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
                      // Disable if category already has a budget and we are not editing that specific budget
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
              <FormLabel>Budget Amount</FormLabel>
              <FormControl>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> {isEditing || existingBudgets.find(b => b.category === form.getValues().category) ? "Update Budget" : "Set Budget"}
        </Button>
      </form>
    </Form>
  );
}
