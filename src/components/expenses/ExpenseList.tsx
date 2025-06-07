
"use client";

import type { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, ArrowDownCircle, ArrowUpCircle, Tag, CalendarDays, Building, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format, parseISO } from 'date-fns';
import { useSettings } from "@/contexts/SettingsContext"; // Use displayCurrency
import { formatCurrency } from "@/lib/utils";

const ITEMS_PER_PAGE = 5;

interface ExpenseListItemProps {
  expense: Expense;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
}

function ExpenseListItem({ expense, onDeleteExpense, onEditExpense }: ExpenseListItemProps) {
  const { displayCurrency, isMounted: settingsMounted } = useSettings(); // Use displayCurrency
  const isIncome = expense.type === 'income';
  const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const iconColor = isIncome ? 'text-green-500' : 'text-red-500';

  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (expense.date) {
      try {
        setFormattedDate(format(parseISO(expense.date), 'PP'));
      } catch (e) {
        console.error("Error formatting date:", expense.date, e);
        setFormattedDate(expense.date);
      }
    }
  }, [expense.date]);

  if (!settingsMounted) {
     return (
        <div className="p-4 border-b h-24 animate-pulse bg-muted/30 rounded-md my-1 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 items-center">
            <div className="flex items-start gap-3">
                <div className="h-6 w-6 mt-1 rounded-full bg-muted"></div>
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="h-5 w-3/4 bg-muted rounded"></div>
                    <div className="h-3 w-1/2 bg-muted rounded"></div>
                     <div className="h-3 w-1/3 bg-muted rounded"></div>
                </div>
            </div>
            <div className="flex sm:flex-col items-end sm:items-end justify-between sm:justify-center gap-2 sm:gap-3">
                <div className="h-6 w-20 bg-muted rounded"></div>
                <div className="flex gap-2">
                    <div className="h-8 w-16 bg-muted rounded-md"></div>
                    <div className="h-8 w-16 bg-muted rounded-md"></div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 border-b hover:bg-muted/50 transition-colors grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 items-center">
      <div className="flex items-start gap-3">
        <TypeIcon className={`h-6 w-6 mt-1 ${iconColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base sm:text-lg text-foreground truncate">{expense.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
            <span className="flex items-center"><Tag className="h-3 w-3 mr-1" />{expense.category}</span>
            <span className="flex items-center"><CalendarDays className="h-3 w-3 mr-1" />{formattedDate || 'Loading date...'}</span>
            {expense.merchant && (
              <span className="flex items-center"><Building className="h-3 w-3 mr-1" />{expense.merchant}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex sm:flex-col items-end sm:items-end justify-between sm:justify-center gap-2 sm:gap-3">
        <p className={`text-lg sm:text-xl font-bold ${amountColor} text-right sm:text-left`}>
          {/* expense.amount is in base currency, formatCurrency converts to displayCurrency */}
          {isIncome ? '+' : '-'}{formatCurrency(expense.amount, displayCurrency)}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditExpense(expense)}
            aria-label="Edit"
          >
            <Edit3 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteExpense(expense.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Delete</span>
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
  const [currentPage, setCurrentPage] = useState(1);
  const { isMounted: settingsMounted } = useSettings();

  const sortedExpenses = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = sortedExpenses.slice(startIndex, endIndex);

  if (!settingsMounted && expenses.length > 0) {
     return (
      <div className="mt-6 space-y-2">
        {[...Array(Math.min(ITEMS_PER_PAGE, 3))].map((_, i) => (
         <div key={i} className="p-4 border-b h-24 animate-pulse bg-muted/30 rounded-md grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 items-center">
            <div className="flex items-start gap-3">
                <div className="h-6 w-6 mt-1 rounded-full bg-muted"></div>
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="h-5 w-3/4 bg-muted rounded"></div>
                    <div className="h-3 w-1/2 bg-muted rounded"></div>
                     <div className="h-3 w-1/3 bg-muted rounded"></div>
                </div>
            </div>
            <div className="flex sm:flex-col items-end sm:items-end justify-between sm:justify-center gap-2 sm:gap-3">
                <div className="h-6 w-20 bg-muted rounded"></div>
                <div className="flex gap-2">
                    <div className="h-8 w-16 bg-muted rounded-md"></div>
                    <div className="h-8 w-16 bg-muted rounded-md"></div>
                </div>
            </div>
        </div>
        ))}
      </div>
    );
  }

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
    <div className="mt-6">
      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {paginatedExpenses.map((expense) => (
            <ExpenseListItem
              key={expense.id}
              expense={expense}
              onDeleteExpense={onDeleteExpense}
              onEditExpense={onEditExpense}
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
