
"use client";

import { AdminShell } from '@/components/admin/layout/AdminShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/contexts/ExpenseContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, TrendingDown, TrendingUp, Users as UsersIcon, ArrowRight, DollarSign, HandCoins } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 

export default function AdminDashboardPage() {
  const { 
    allPlatformExpenses, 
    loadingAllPlatformExpenses,
    platformRevenue,
    loadingPlatformRevenue 
  } = useExpenses();
  const { displayCurrency, isMounted: settingsMounted } = useSettings();
  const { user } = useAuth(); 

  const pageSpecificLoading = loadingAllPlatformExpenses || loadingPlatformRevenue || !settingsMounted;

  const totalTransactions = allPlatformExpenses.length;

  const totalExpenseValue = useMemo(() => {
    return allPlatformExpenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allPlatformExpenses]);

  const totalIncomeValue = useMemo(() => {
    // This is user-generated income, not platform profits
    return allPlatformExpenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allPlatformExpenses]);

  const totalPlatformProfits = useMemo(() => {
    return platformRevenue.reduce((sum, entry) => sum + entry.amount, 0);
  }, [platformRevenue]);


  const managementLinks = [
    { href: '/admin/users', label: 'Manage Users', icon: UsersIcon, description: 'View and manage platform users.' },
  ];

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-2xl md:text-3xl font-semibold text-foreground">
            Platform Overview
          </h1>
          {user && <p className="text-xs text-muted-foreground">Admin: {user.email}</p>}
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          Global platform analytics (all amounts displayed in {pageSpecificLoading ? '...' : displayCurrency}).
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Platform Transactions</CardTitle>
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{pageSpecificLoading ? '...' : totalTransactions}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total User Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{pageSpecificLoading ? '...' : formatCurrency(totalExpenseValue, displayCurrency)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total User Income</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{pageSpecificLoading ? '...' : formatCurrency(totalIncomeValue, displayCurrency)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl bg-primary/5 dark:bg-primary/10 border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-primary">Total Platform Profits</CardTitle>
              <HandCoins className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{pageSpecificLoading ? '...' : formatCurrency(totalPlatformProfits, displayCurrency)}</div>
              <p className="text-xs text-muted-foreground mt-1">From penalties & transaction fees.</p>
            </CardContent>
          </Card>
        </div>

        {managementLinks.length > 0 && (
            <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Quick Management Links</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Navigate to key admin areas.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {managementLinks.map(link => (
                <Link href={link.href} key={link.href} passHref>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col rounded-lg">
                    <CardHeader className="flex-row items-start gap-4 space-y-0">
                        <link.icon className="h-5 w-5 md:h-6 md:w-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                        <CardTitle className="text-base md:text-lg">{link.label}</CardTitle>
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

         <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Advanced Platform Analytics (Future)</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  The following analytics require backend processing (e.g., Cloud Functions) for efficient and scalable implementation.
                  They are not available with the current client-side setup.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground text-sm md:text-base">Features Requiring Backend Development:</p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-xs sm:text-sm">
                    <li>Most active users by transaction volume.</li>
                    <li>Total transaction amounts per client (daily, weekly, monthly summaries).</li>
                    <li>Collective client transaction statistics (e.g., platform-wide daily/weekly/monthly totals).</li>
                    <li>Average transactions per hour.</li>
                    <li>Real-time data streams for key metrics.</li>
                    <li>Breakdown of most common and highest-spending categories (currently calculated client-side from all transactions, better done on backend).</li>
                    <li>Detailed breakdown of platform profits (e.g., by type, by user).</li>
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
