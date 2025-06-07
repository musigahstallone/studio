
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, ListChecks, PlusCircle } from 'lucide-react';
import { useExpenses } from '@/contexts/ExpenseContext'; 
import { useMemo } from 'react';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { expenses } = useExpenses(); 

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

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            Welcome to PennyPincher AI
          </h1>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/expenses">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Transaction
            </Link>
          </Button>
        </div>

        <p className="text-lg text-muted-foreground">
          Your smart assistant for managing finances with ease.
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
