
"use client";

import type { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onDeleteExpense, onEditExpense }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No expenses or income recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="font-headline text-2xl font-semibold text-foreground">Transactions</h2>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
          <Card key={expense.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center">
                    {expense.type === 'income' ? 
                      <ArrowUpCircle className="h-6 w-6 text-green-500 mr-2" /> : 
                      <ArrowDownCircle className="h-6 w-6 text-red-500 mr-2" />}
                    {expense.description}
                  </CardTitle>
                  <CardDescription>{new Date(expense.date).toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant="outline" className="text-sm mt-1">{expense.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 pt-0">
              {expense.merchant && (
                <p className="text-sm text-muted-foreground">
                  Merchant: <span className="font-medium text-foreground">{expense.merchant}</span>
                </p>
              )}
              <p className={`text-2xl font-bold ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)}
              </p>
            </CardContent>
            <Separator className="my-2"/>
            <CardFooter className="flex justify-end gap-2 pt-3 pb-4 px-4">
              <Button variant="ghost" size="sm" onClick={() => onEditExpense(expense)} aria-label="Edit">
                <Edit3 className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeleteExpense(expense.id)} aria-label="Delete" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
