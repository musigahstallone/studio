
"use client";

import type { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ArrowDownCircle, ArrowUpCircle, DollarSign, Tag, CalendarDays, Building } from "lucide-react";
import { Card, CardContent, CardDescription } from "@/components/ui/card"; // Keep Card for empty state

interface ExpenseListItemProps {
  expense: Expense;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
}

function ExpenseListItem({ expense, onDeleteExpense, onEditExpense }: ExpenseListItemProps) {
  const isIncome = expense.type === 'income';
  const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const iconColor = isIncome ? 'text-green-500' : 'text-red-500';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors">
      <div className="flex items-start space-x-3 flex-grow mb-3 sm:mb-0">
        <TypeIcon className={`h-6 w-6 sm:h-5 sm:w-5 mt-1 sm:mt-0 ${iconColor} flex-shrink-0`} />
        <div className="flex-grow space-y-1">
          <p className="font-semibold text-base sm:text-lg text-foreground">{expense.description}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center"><Tag className="h-3 w-3 mr-1" />{expense.category}</span>
            <span className="flex items-center"><CalendarDays className="h-3 w-3 mr-1" />{new Date(expense.date).toLocaleDateString()}</span>
            {expense.merchant && <span className="flex items-center"><Building className="h-3 w-3 mr-1" />{expense.merchant}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <p className={`text-xl sm:text-2xl font-bold ${amountColor} self-start sm:self-center ml-9 sm:ml-0`}>
          {isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
        </p>
        <div className="flex gap-2 self-end sm:self-center">
          <Button variant="outline" size="sm" onClick={() => onEditExpense(expense)} aria-label="Edit">
            <Edit3 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDeleteExpense(expense.id)} aria-label="Delete" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

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
          <p className="text-center text-muted-foreground">No transactions recorded yet.</p>
          <CardDescription className="text-center mt-2">Click &quot;Add Transaction&quot; to get started.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 border rounded-lg overflow-hidden">
      <div className="divide-y">
        {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
          <ExpenseListItem 
            key={expense.id} 
            expense={expense} 
            onDeleteExpense={onDeleteExpense} 
            onEditExpense={onEditExpense} 
          />
        ))}
      </div>
    </div>
  );
}
