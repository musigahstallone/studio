
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useBudgets } from '@/contexts/ExpenseContext';
import { useMemo } from 'react';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, TrendingDown, TrendingUp, Target, Tag, CreditCard, BarChart3, Users, ListChecks, Settings, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const { expenses } = useExpenses();
  const { budgets } = useBudgets();

  const totalTransactions = expenses.length;

  const totalExpenseValue = useMemo(() => {
    return expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalIncomeValue = useMemo(() => {
    return expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const activeBudgetsCount = budgets.length;

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    expenses
      .filter(e => e.type === 'expense')
      .forEach(expense => {
        counts[expense.category] = (counts[expense.category] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [expenses]);

  const mostCommonCategory = categoryCounts.length > 0 ? categoryCounts[0] : { category: "N/A", count: 0 };

  const spendingByCategory = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    expenses
      .filter(e => e.type === 'expense')
      .forEach(expense => {
        categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
      });
    return Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const topSpendingCategory = spendingByCategory.length > 0 ? spendingByCategory[0] : { category: "N/A", total: 0 };
  
  // For now, mock user count as it's not implemented
  const mockUserCount = 150; 


  const managementLinks = [
    { href: '/expenses', label: 'Manage All Transactions', icon: ListChecks, description: 'View and manage all recorded transactions.' },
    { href: '/budgets', label: 'Manage All Budgets', icon: Target, description: 'Oversee and adjust all defined budgets.' },
    { href: '/admin/users', label: 'Manage Users', icon: Users, description: 'View platform users (mock data).' },
    { href: '/settings', label: 'App Settings', icon: Settings, description: 'Configure application-wide settings.' },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Platform analytics and management overview.
          <span className="italic"> (Note: Data reflects local session as multi-user backend is not implemented.)</span>
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Across all entries</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses Value</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalExpenseValue.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">Sum of all expenses</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income Value</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalIncomeValue.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">Sum of all income</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registered Users</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockUserCount}</div>
              <p className="text-xs text-muted-foreground">(Mock data)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Quick Management</CardTitle>
            <CardDescription>Jump to key management areas.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {managementLinks.map(link => (
              <Link href={link.href} key={link.href} passHref>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                  <CardHeader className="flex-row items-start gap-4 space-y-0">
                    <link.icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <CardTitle className="text-lg">{link.label}</CardTitle>
                      <CardDescription className="text-xs">{link.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto text-right">
                     <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        Go to Section <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
           <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <Tag className="h-6 w-6 mr-3 text-purple-500" />
                    Most Common Category
                </CardTitle>
                <CardDescription>Expense category with the highest number of transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold text-foreground">{mostCommonCategory.category}</div>
                <p className="text-sm text-muted-foreground">{mostCommonCategory.count} transactions</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <BarChart3 className="h-6 w-6 mr-3 text-orange-500" />
                    Highest Spending Category
                </CardTitle>
                <CardDescription>Expense category with the highest total spending.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold text-foreground">{topSpendingCategory.category}</div>
                <p className="text-sm text-muted-foreground">Total: ${topSpendingCategory.total.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <CreditCard className="h-6 w-6 mr-3 text-primary" />
              Recent Platform Activity
            </CardTitle>
             <CardDescription>Latest transactions recorded across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList count={10} />
          </CardContent>
        </Card>
        
      </div>
    </AppShell>
  );
}
