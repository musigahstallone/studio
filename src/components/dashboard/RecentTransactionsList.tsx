
"use client";

import type { Expense } from "@/lib/types";
import { useExpenses } from "@/contexts/ExpenseContext";
import { ArrowDownCircle, ArrowUpCircle, Tag, CalendarDays } from "lucide-react";
import { Card, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { format, parseISO } from 'date-fns';

interface RecentTransactionItemProps {
  expense: Expense;
}

function RecentTransactionItem({ expense }: RecentTransactionItemProps) {
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

  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <TypeIcon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate" title={expense.description}>{expense.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center"><Tag className="h-3 w-3 mr-1" />{expense.category}</span>
            <span className="hidden sm:flex items-center"><CalendarDays className="h-3 w-3 mr-1" />{formattedDate || 'Loading date...'}</span>
          </div>
        </div>
      </div>
      <p className={`text-sm font-semibold ${amountColor} whitespace-nowrap`}>
        {isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
      </p>
    </div>
  );
}


interface RecentTransactionsListProps {
  count: number;
  expensesData?: Expense[]; // Optional prop to pass specific expenses (e.g., for admin)
}

export function RecentTransactionsList({ count, expensesData }: RecentTransactionsListProps) {
  const { expenses: userExpenses } = useExpenses(); // These are already filtered for the current user

  // Use provided expensesData if available (for admin), otherwise use user-scoped expenses
  const sourceExpenses = expensesData || userExpenses;

  const recentExpenses = sourceExpenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);

  if (recentExpenses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        <p>No transactions recorded yet.</p>
        {!expensesData && ( // Show "Add transaction" link only if not admin view
          <CardDescription className="mt-1">
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/expenses">Add your first transaction</Link>
            </Button>
            to see it here.
          </CardDescription>
        )}
      </div>
    );
  }

  return (
    <div className="flow-root">
      <div className="-my-3 divide-y divide-border">
        {recentExpenses.map((expense) => (
          <RecentTransactionItem key={expense.id} expense={expense} />
        ))}
      </div>
      {sourceExpenses.length > count && !expensesData && ( // Show "View All" only if not admin view using its own data
        <div className="mt-4 text-center">
          <Button variant="outline" asChild size="sm">
            <Link href="/expenses">View All My Transactions</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
