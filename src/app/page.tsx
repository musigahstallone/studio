
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, ListChecks, Target } from 'lucide-react';
import { useExpenses } from '@/contexts/ExpenseContext'; 
import { useBudgets } from '@/contexts/ExpenseContext';
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
    return budgets 
      .map(budget => ({
        ...budget,
        progress: budget.amount > 0 ? Math.min((budget.spentAmount / budget.amount) * 100, 100) : 0, // Cap progress at 100% for display
        isOverBudget: budget.spentAmount > budget.amount,
        percentageSpent: budget.amount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0,
      }))
      .sort((a, b) => b.percentageSpent - a.percentageSpent) // Sort by highest percentage spent first
      .slice(0, 3); 
  }, [budgets]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            Welcome Back!
          </h1>
          {/* "Add New Transaction" button removed from here */}
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
              <CardDescription>Your top budgets by spending progress.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetHighlights.map(budget => (
                <Card key={budget.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                    <CardDescription>{budget.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <Progress value={budget.progress} className={`h-2.5 ${budget.isOverBudget ? "[&>div]:bg-destructive" : ""}`} />
                    <div className="flex justify-between text-sm">
                      <span className={budget.isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
                        Spent: ${budget.spentAmount.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        Budget: ${budget.amount.toFixed(2)}
                      </span>
                    </div>
                    {budget.isOverBudget && (
                         <p className="text-xs text-destructive text-center">
                           Over budget by ${(budget.spentAmount - budget.amount).toFixed(2)}!
                         </p>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0 text-right">
                     <Button variant="link" asChild size="sm" className="text-xs">
                        <Link href="/budgets">Manage Budgets</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </CardContent>
             {budgets.length > 3 && (
              <div className="p-4 pt-0 text-center">
                 <Button variant="outline" asChild size="sm">
                    <Link href="/budgets">View All Budgets</Link>
                </Button>
              </div>
            )}
          </Card>
        )}
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <ListChecks className="h-6 w-6 mr-3 text-primary" />
              Recent Transactions
            </CardTitle>
             <CardDescription>Your latest financial movements.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList count={5} />
          </CardContent>
        </Card>
        
      </div>
    </AppShell>
  );
}
