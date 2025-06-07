
"use client";

import type { Budget } from "@/lib/types";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Target } from "lucide-react";

interface BudgetListItemProps {
  budget: Budget;
  onDeleteBudget: (id: string) => void;
  onEditBudget: (budget: Budget) => void;
}

function BudgetListItem({ budget, onDeleteBudget, onEditBudget }: BudgetListItemProps) {
  const progress = budget.amount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0;
  const remaining = budget.amount - budget.spentAmount;
  const isOverBudget = budget.spentAmount > budget.amount;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors">
      <div className="flex items-start space-x-3 flex-grow mb-3 sm:mb-0">
        <Target className="h-6 w-6 sm:h-5 sm:w-5 mt-1 sm:mt-0 text-primary flex-shrink-0" />
        <div className="flex-grow space-y-1">
          <p className="font-semibold text-base sm:text-lg text-foreground">{budget.category}</p>
          <div className="w-full max-w-xs">
            <Progress value={Math.min(progress, 100)} className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Spent: ${budget.spentAmount.toFixed(2)}</span>
              <span>Budget: ${budget.amount.toFixed(2)}</span>
            </div>
            <p className={`text-xs mt-0.5 ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverBudget 
                ? `Over by $${Math.abs(remaining).toFixed(2)}` 
                : `$${remaining.toFixed(2)} remaining`}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 self-end sm:self-center mt-2 sm:mt-0">
        <Button variant="outline" size="sm" onClick={() => onEditBudget(budget)} aria-label="Edit budget">
          <Edit3 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDeleteBudget(budget.id)} aria-label="Delete budget" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
}


interface BudgetListProps {
  budgets: Budget[];
  onDeleteBudget: (id: string) => void;
  onEditBudget: (budget: Budget) => void;
}

export function BudgetList({ budgets, onDeleteBudget, onEditBudget }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No budgets set yet.</p>
          <CardDescription className="text-center mt-2">Click &quot;Set New Budget&quot; to define your spending limits.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 border rounded-lg overflow-hidden">
      <div className="divide-y">
        {budgets.map((budget) => (
          <BudgetListItem 
            key={budget.id} 
            budget={budget} 
            onDeleteBudget={onDeleteBudget} 
            onEditBudget={onEditBudget}
          />
        ))}
      </div>
    </div>
  );
}
