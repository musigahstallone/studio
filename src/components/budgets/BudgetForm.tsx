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
import { expenseCategories } from "@/lib/types"; // Budgets are typically for expenses
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const BudgetFormSchema = z.object({
  category: z.string().min(1, { message: "Category is required." }),
  amount: z.number().positive({ message: "Budget amount must be positive." }),
});

interface BudgetFormProps {
  onAddOrUpdateBudget: (budget: Budget) => void;
  existingBudgets: Budget[]; // To prevent duplicate category budgets easily
}

export function BudgetForm({ onAddOrUpdateBudget, existingBudgets }: BudgetFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof BudgetFormSchema>>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: {
      category: "",
      amount: 0,
    },
  });

  function onSubmit(values: z.infer<typeof BudgetFormSchema>) {
    const existingBudgetForCategory = existingBudgets.find(b => b.category === values.category);
    
    const newBudget: Budget = {
      id: existingBudgetForCategory ? existingBudgetForCategory.id : crypto.randomUUID(),
      category: values.category as any, // Cast as Category, zod ensures it's a string.
      amount: values.amount,
      spentAmount: existingBudgetForCategory ? existingBudgetForCategory.spentAmount : 0, // Preserve spent amount if updating
    };

    onAddOrUpdateBudget(newBudget);
    toast({
      title: existingBudgetForCategory ? "Budget Updated" : "Budget Set",
      description: `${values.category}: $${values.amount.toFixed(2)}`,
    });
    form.reset();
  }
  
  const availableCategories = expenseCategories.filter(
    cat => !existingBudgets.find(b => b.category === cat && b.id !== form.getValues().category) // Allow current category if editing
  );


  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Monthly Budget</CardTitle>
        <CardDescription>Define your spending limits for various categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an expense category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => ( // Show all, but logic handles update vs add
                        <SelectItem key={category} value={category}>
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
            <Button type="submit" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Set/Update Budget
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
