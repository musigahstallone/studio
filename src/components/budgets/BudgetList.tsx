"use client";

import type { Budget, Expense } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface BudgetListProps {
  budgets: Budget[];
  expenses: Expense[]; // Needed to calculate spent amount
  onDeleteBudget: (id: string) => void;
}

export function BudgetList({ budgets, expenses, onDeleteBudget }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No budgets set yet.</p>
        </CardContent>
      </Card>
    );
  }

  const calculateSpentAmount = (category: Budget['category']): number => {
    return expenses
      .filter(e => e.type === 'expense' && e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="font-headline">Current Budgets</CardTitle>
        <CardDescription>Track your spending against your set budgets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {budgets.map((budget) => {
          const spent = calculateSpentAmount(budget.category);
          const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          const remaining = budget.amount - spent;
          const isOverBudget = spent > budget.amount;

          return (
            <div key={budget.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{budget.category}</h3>
                <Button variant="ghost" size="icon" onClick={() => onDeleteBudget(budget.id)} aria-label="Delete budget">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Spent: ${spent.toFixed(2)}</span>
                <span>Budget: ${budget.amount.toFixed(2)}</span>
              </div>
              <Progress value={Math.min(progress, 100)} className={isOverBudget ? "[&>div]:bg-destructive" : ""} />
              <p className={`text-xs mt-1 ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                {isOverBudget 
                  ? `Over budget by $${Math.abs(remaining).toFixed(2)}` 
                  : `$${remaining.toFixed(2)} remaining`}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
