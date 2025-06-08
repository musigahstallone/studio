
"use client";

import { AdminShell } from '@/components/admin/layout/AdminShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/contexts/ExpenseContext';
// import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList'; // Removed
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, TrendingDown, TrendingUp, Users as UsersIcon, ArrowRight, /* BarChart3, Tag as TagIcon, CreditCard */ } from 'lucide-react'; // Commented out unused icons
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 

export default function AdminDashboardPage() {
  const { allPlatformExpenses, loadingAllPlatformExpenses } = useExpenses();
  const { displayCurrency, isMounted: settingsMounted } = useSettings();
  const { user } = useAuth(); 

  const pageSpecificLoading = loadingAllPlatformExpenses || !settingsMounted;

  const totalTransactions = allPlatformExpenses.length;

  const totalExpenseValue = useMemo(() => {
    return allPlatformExpenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allPlatformExpenses]);

  const totalIncomeValue = useMemo(() => {
    return allPlatformExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allPlatformExpenses]);

  /* 
  // Logic for category stats - kept for potential future use, but cards are removed from display
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allPlatformExpenses
      .filter(e => e.type === 'expense')
      .forEach(expense => {
        counts[expense.category] = (counts[expense.category] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [allPlatformExpenses]);

  const mostCommonCategory = categoryCounts.length > 0 ? categoryCounts[0] : { category: "N/A", count: 0 };

  const spendingByCategory = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    allPlatformExpenses
      .filter(e => e.type === 'expense')
      .forEach(expense => {
        categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
      });
    return Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [allPlatformExpenses]);

  const topSpendingCategory = spendingByCategory.length > 0 ? spendingByCategory[0] : { category: "N/A", total: 0 };
  */

  const managementLinks = [
    { href: '/admin/users', label: 'Manage Users', icon: UsersIcon, description: 'View and manage platform users.' },
    // { href: '/settings', label: 'Go to App Settings', icon: Settings, description: 'Configure global application settings.' }, // Removed
  ];

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            Platform Overview
          </h1>
          {user && <p className="text-xs text-muted-foreground">Admin: {user.email}</p>}
        </div>
        <p className="text-sm text-muted-foreground">
          Global platform analytics (all amounts displayed in {pageSpecificLoading ? '...' : displayCurrency}).
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Transactions</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pageSpecificLoading ? '...' : totalTransactions}</div>
              {/* <p className="text-xs text-muted-foreground">From 'expenses_all'</p> Removed */}
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pageSpecificLoading ? '...' : formatCurrency(totalExpenseValue, displayCurrency)}</div>
               {/* <p className="text-xs text-muted-foreground">Sum from 'expenses_all'</p> Removed */}
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pageSpecificLoading ? '...' : formatCurrency(totalIncomeValue, displayCurrency)}</div>
               {/* <p className="text-xs text-muted-foreground">Sum from 'expenses_all'</p> Removed */}
            </CardContent>
          </Card>
        </div>

        {managementLinks.length > 0 && (
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Quick Management Links</CardTitle>
                <CardDescription>Navigate to key admin areas.</CardDescription>
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
                            Go <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                    </Card>
                </Link>
                ))}
            </CardContent>
            </Card>
        )}


        {/* Category statistics cards removed from display, logic remains in code for potential future use.
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
           <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <TagIcon className="h-6 w-6 mr-3 text-purple-500" />
                    Most Common Platform Category
                </CardTitle>
                <CardDescription>Expense category with the highest number of transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold text-foreground">{pageSpecificLoading ? '...' : mostCommonCategory.category}</div>
                <p className="text-sm text-muted-foreground">{pageSpecificLoading ? '...' : `${mostCommonCategory.count} transactions`}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    <BarChart3 className="h-6 w-6 mr-3 text-orange-500" />
                    Highest Spending Platform Category
                </CardTitle>
                <CardDescription>Expense category with the highest total spending (displayed in {pageSpecificLoading ? '...' : displayCurrency}).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold text-foreground">{pageSpecificLoading ? '...' : topSpendingCategory.category}</div>
                <p className="text-sm text-muted-foreground">Total: {pageSpecificLoading ? '...' : formatCurrency(topSpendingCategory.total, displayCurrency)}</p>
            </CardContent>
          </Card>
        </div>
        */}

        {/* Recent Platform Activity card removed 
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <CreditCard className="h-6 w-6 mr-3 text-primary" />
              Recent Platform Activity
            </CardTitle>
             <CardDescription>Latest transactions recorded across the platform (displayed in {pageSpecificLoading ? '...' : displayCurrency}).</CardDescription>
          </CardHeader>
          <CardContent>
            {pageSpecificLoading ? <p>Loading transactions...</p> : <RecentTransactionsList count={10} expensesData={allPlatformExpenses} />}
          </CardContent>
        </Card>
        */}

         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Advanced Platform Analytics (Future)</CardTitle>
                <CardDescription>
                  The following analytics require backend processing (e.g., Cloud Functions) for efficient and scalable implementation.
                  They are not available with the current client-side setup.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">Features Requiring Backend Development:</p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                    <li>Most active users by transaction volume.</li>
                    <li>Total transaction amounts per client (daily, weekly, monthly summaries).</li>
                    <li>Collective client transaction statistics (e.g., platform-wide daily/weekly/monthly totals).</li>
                    <li>Average transactions per hour.</li>
                    <li>Real-time data streams for key metrics.</li>
                    <li>Breakdown of most common and highest-spending categories (currently calculated client-side from all transactions, better done on backend).</li>
                </ul>
                 <p className="mt-3 text-xs">
                  These features typically involve server-side aggregation of data and potentially storing pre-calculated results for quick retrieval.
                </p>
            </CardContent>
          </Card>
      </div>
    </AdminShell>
  );
}
