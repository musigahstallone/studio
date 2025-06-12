
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, ListChecks, Target, Loader2, Landmark } from 'lucide-react';
import { useExpenses, useBudgets } from '@/contexts/ExpenseContext';
import { useMemo } from 'react';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/lib/utils';


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { expenses, loadingExpenses } = useExpenses();
  const { budgets, loadingBudgets } = useBudgets();
  const { displayCurrency, isMounted: settingsMounted } = useSettings();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const totalIncome = useMemo(() => {
    return expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalExpensesValue = useMemo(() => {
    return expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const balance = totalIncome - totalExpensesValue;

  const budgetHighlights = useMemo(() => {
    return budgets
      .map(budget => ({
        ...budget,
        progress: budget.amount > 0 ? Math.min((budget.spentAmount / budget.amount) * 100, 100) : 0,
        isOverBudget: budget.spentAmount > budget.amount,
        percentageSpent: budget.amount > 0 ? (budget.spentAmount / budget.amount) * 100 : 0,
      }))
      .sort((a, b) => b.percentageSpent - a.percentageSpent)
      .slice(0, 3);
  }, [budgets]);

  if (authLoading || (!user && !authLoading) || loadingExpenses || loadingBudgets || !settingsMounted) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm md:text-base">Loading Dashboard...</p>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-2xl md:text-3xl font-semibold text-foreground">
            Welcome Back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
          </h1>
        </div>

        <p className="text-md md:text-lg text-muted-foreground">
          Here&apos;s your financial overview. All amounts displayed in {displayCurrency}.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalIncome, displayCurrency)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalExpensesValue, displayCurrency)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(balance, displayCurrency)}</div>
            </CardContent>
          </Card>
        </div>

        {budgetHighlights.length > 0 && (
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                <Target className="h-5 w-5 md:h-6 md:w-6 mr-3 text-primary" />
                Budget Highlights
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your top budgets by spending progress (displayed in {displayCurrency}).</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetHighlights.map(budget => (
                <Card key={budget.id} className="flex flex-col bg-card hover:shadow-md transition-shadow rounded-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg">{budget.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{budget.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <Progress value={budget.progress} className={`h-2.5 ${budget.isOverBudget ? "[&>div]:bg-destructive" : ""}`} />
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className={budget.isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
                        Spent: {formatCurrency(budget.spentAmount, displayCurrency)}
                      </span>
                      <span className="text-muted-foreground">
                        Budget: {formatCurrency(budget.amount, displayCurrency)}
                      </span>
                    </div>
                    {budget.isOverBudget && (
                         <p className="text-xs text-destructive text-center">
                           Over budget by {formatCurrency(budget.spentAmount - budget.amount, displayCurrency)}!
                         </p>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0 text-right">
                     <Button variant="link" asChild size="sm" className="text-xs text-primary hover:text-primary/80">
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
             {budgets.length === 0 && (
                <CardContent>
                    <p className="text-muted-foreground text-center text-sm md:text-base">No budgets set yet.
                        <Button variant="link" asChild className="p-1 h-auto text-sm md:text-base">
                           <Link href="/budgets">Create one</Link>
                        </Button>
                         to see highlights here.
                    </p>
                </CardContent>
            )}
          </Card>
        )}

        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <ListChecks className="h-5 w-5 md:h-6 md:w-6 mr-3 text-primary" />
              Recent Transactions
            </CardTitle>
             <CardDescription className="text-xs sm:text-sm">Your latest financial movements (displayed in {displayCurrency}).</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList count={5} />
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
