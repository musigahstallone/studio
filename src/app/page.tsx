
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, ListChecks, PlusCircle, Target } from 'lucide-react';
import { useExpenses } from '@/contexts/ExpenseContext'; 
import { useBudgets } from '@/contexts/ExpenseContext'; // Corrected import
import { useMemo } from 'react';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";


export default function DashboardPage() {
  const { expenses } = useExpenses(); 
  const { budgets } = useBudgets(); 

  const totalIncome = useMemo(() => {
    return expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);
  
  const balance = totalIncome - totalExpenses;

  const budgetHighlights = useMemo(() => {
    // The budgets from useBudgets already have spentAmount calculated
    return budgets 
      .map(budget => ({
        ...budget,
        progress: budget.amount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0,
      }))
      .sort((a, b) => b.progress - a.progress) 
      .slice(0, 3); 
  }, [budgets]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            Welcome Back!
          </h1>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/expenses">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Transaction
            </Link>
          </Button>
        </div>

        <p className="text-lg text-muted-foreground">
          Here&apos;s your financial overview.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${balance.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {budgetHighlights.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Target className="h-6 w-6 mr-3 text-primary" />
                Budget Highlights
              </CardTitle>
              <CardDescription>A quick look at your top budgets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetHighlights.map(budget => (
                <div key={budget.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">{budget.name} ({budget.category})</span>
                    <span className={budget.spentAmount > budget.amount ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                      ${budget.spentAmount.toFixed(2)} / ${budget.amount.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={Math.min(budget.progress, 100)} className={`h-2 ${budget.spentAmount > budget.amount ? "[&>div]:bg-destructive" : ""}`} />
                </div>
              ))}
              <div className="mt-4 text-right">
                 <Button variant="link" asChild size="sm">
                    <Link href="/budgets">View All Budgets</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <ListChecks className="h-6 w-6 mr-3 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList count={5} />
          </CardContent>
        </Card>
        
      </div>
    </AppShell>
  );
}
