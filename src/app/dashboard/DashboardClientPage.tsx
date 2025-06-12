
"use client";

import { useEffect } from 'react';
// useRouter is not directly used here anymore, AppShell handles redirects.
// import { useRouter } from 'next/navigation'; 
import { useAuth } from '@/contexts/AuthContext';

// AppShell is now rendered by the parent page.tsx
// import { AppShell } from '@/components/layout/AppShell'; 
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

export function DashboardClientPage() { // Renamed and made exportable
  const { user, loading: authLoading } = useAuth();
  const { expenses, loadingExpenses: expLoading } = useExpenses();
  const { budgets, loadingBudgets: budLoading } = useBudgets();
  const { displayCurrency, isMounted: settingsMounted } = useSettings();


  const totalIncome = useMemo(() => expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalExpense = useMemo(() => expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0), [expenses]);
  const balance = totalIncome - totalExpense;
  const highlights = useMemo(() => budgets.map(b => ({ ...b, pct: b.amount ? Math.min((b.spentAmount / b.amount) * 100, 100) : 0 })).sort((a, b) => b.pct - a.pct).slice(0, 3), [budgets]);

  // The AppShell (which uses useRouter/useSearchParams) is now in the parent page.tsx
  // If loading is true, this component itself shows a loader,
  // but the initial page load and auth check is handled by AppShell in page.tsx + Suspense fallback.
  if (authLoading || expLoading || budLoading || !settingsMounted) {
    return (
      // No AppShell here as it's provided by the parent server component
      <div className="h-full flex justify-center items-center py-10">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }
  
  // If user is null after authLoading is false, AppShell in parent page.tsx will handle redirect.
  // So, we can assume `user` is available here for display purposes, or the component won't render due to redirect.

  return (
    // No AppShell here
    <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">Welcome.</h1>
          <p className="text-2xl md:text-3xl text-primary font-semibold mt-0.5">{user?.displayName || 'User'}</p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Here's an overview of your finances in <span className="font-medium">{displayCurrency}</span>.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <Card className="p-6 hover:shadow-xl transition rounded-2xl bg-card">
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <h3 className="text-sm text-muted-foreground">Total Income</h3>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalIncome, displayCurrency)}</p>
          </Card>
          <Card className="p-6 hover:shadow-xl transition rounded-2xl bg-card">
            <TrendingDown className="h-6 w-6 text-destructive mb-2" />
            <h3 className="text-sm text-muted-foreground">Total Expenses</h3>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalExpense, displayCurrency)}</p>
          </Card>
          <Card className="p-6 hover:shadow-xl transition rounded-2xl bg-card">
            <DollarSign className="h-6 w-6 text-accent mb-2" />
            <h3 className="text-sm text-muted-foreground">Balance</h3>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(balance, displayCurrency)}</p>
          </Card>
        </div>

        {highlights.length > 0 && (
          <Card className="p-6 mb-8 rounded-2xl hover:shadow-lg transition bg-card">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-lg font-semibold text-foreground">Budget Highlights</h2>
            </div>
            <div className="space-y-4">
              {highlights.map(b => (
                <div key={b.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.category}</p>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{b.pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-3 sm:p-6 rounded-2xl hover:shadow-lg transition bg-card">
          <div className="flex items-center mb-4">
            <ListChecks className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
          </div>
          <RecentTransactionsList count={5} />
        </Card>
      </div>
  );
}
