
"use client";

import type { Budget } from "@/lib/types";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

const ITEMS_PER_PAGE = 5;

interface BudgetListItemProps {
  budget: Budget;
  onDeleteBudget: (id: string) => void;
  onEditBudget: (budget: Budget) => void;
}

function BudgetListItem({ budget, onDeleteBudget, onEditBudget }: BudgetListItemProps) {
  const { currency, isMounted: settingsMounted } = useSettings();
  const progress = budget.amount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0;
  const remaining = budget.amount - budget.spentAmount;
  const isOverBudget = budget.spentAmount > budget.amount;

  if (!settingsMounted) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b h-28 animate-pulse bg-muted/30 rounded-md my-1">
            <div className="flex items-start space-x-3 flex-grow mb-3 sm:mb-0">
                <div className="h-6 w-6 sm:h-5 sm:w-5 mt-1 sm:mt-0 rounded-full bg-muted"></div>
                <div className="flex-grow space-y-1">
                    <div className="h-5 w-32 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded"></div>
                    <div className="w-full max-w-xs mt-1 space-y-1">
                        <div className="h-2 w-full bg-muted rounded-full"></div>
                        <div className="flex justify-between">
                            <div className="h-3 w-16 bg-muted rounded"></div>
                            <div className="h-3 w-16 bg-muted rounded"></div>
                        </div>
                        <div className="h-3 w-20 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center mt-2 sm:mt-0">
                <div className="h-8 w-16 bg-muted rounded-md"></div>
                <div className="h-8 w-16 bg-muted rounded-md"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors">
      <div className="flex items-start space-x-3 flex-grow mb-3 sm:mb-0">
        <Target className="h-6 w-6 sm:h-5 sm:w-5 mt-1 sm:mt-0 text-primary flex-shrink-0" />
        <div className="flex-grow space-y-1">
          <p className="font-semibold text-base sm:text-lg text-foreground">{budget.name}</p>
          <p className="text-sm text-muted-foreground">{budget.category}</p>
          <div className="w-full max-w-xs mt-1">
            <Progress value={Math.min(progress, 100)} className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Spent: {formatCurrency(budget.spentAmount, currency)}</span>
              <span>Budget: {formatCurrency(budget.amount, currency)}</span>
            </div>
            <p className={`text-xs mt-0.5 ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverBudget
                ? `Over by ${formatCurrency(Math.abs(remaining), currency)}`
                : `${formatCurrency(remaining, currency)} remaining`}
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
  const [currentPage, setCurrentPage] = useState(1);
  const { isMounted: settingsMounted } = useSettings();

  const sortedBudgets = budgets.sort((a,b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(sortedBudgets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBudgets = sortedBudgets.slice(startIndex, endIndex);

  if (!settingsMounted && budgets.length > 0) {
    return (
      <div className="mt-6 space-y-2">
        {[...Array(Math.min(ITEMS_PER_PAGE, 2))].map((_, i) => (
             <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b h-28 animate-pulse bg-muted/30 rounded-md">
                <div className="flex items-start space-x-3 flex-grow mb-3 sm:mb-0">
                    <div className="h-6 w-6 sm:h-5 sm:w-5 mt-1 sm:mt-0 rounded-full bg-muted"></div>
                    <div className="flex-grow space-y-1">
                        <div className="h-5 w-32 bg-muted rounded"></div>
                        <div className="h-3 w-24 bg-muted rounded"></div>
                        <div className="w-full max-w-xs mt-1 space-y-1">
                            <div className="h-2 w-full bg-muted rounded-full"></div>
                            <div className="flex justify-between">
                                <div className="h-3 w-16 bg-muted rounded"></div>
                                <div className="h-3 w-16 bg-muted rounded"></div>
                            </div>
                            <div className="h-3 w-20 bg-muted rounded"></div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 self-end sm:self-center mt-2 sm:mt-0">
                    <div className="h-8 w-16 bg-muted rounded-md"></div>
                    <div className="h-8 w-16 bg-muted rounded-md"></div>
                </div>
            </div>
        ))}
      </div>
    );
  }

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
    <div className="mt-6">
      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {paginatedBudgets.map((budget) => (
            <BudgetListItem
              key={budget.id}
              budget={budget}
              onDeleteBudget={onDeleteBudget}
              onEditBudget={onEditBudget}
            />
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
