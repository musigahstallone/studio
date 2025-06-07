
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses, useBudgets } from '@/contexts/ExpenseContext';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, TrendingDown, TrendingUp, Target, Tag, CreditCard, BarChart3, Users, ListChecks, Settings, ArrowRight, Loader2, Lock } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext'; // Use displayCurrency
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';


export default function AdminDashboardPage() {
  const { user, isAdminUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { allPlatformExpenses, loadingAllPlatformExpenses } = useExpenses();
  const { allPlatformBudgets, loadingAllPlatformBudgets } = useBudgets();
  const { displayCurrency, isMounted: settingsMounted } = useSettings(); // Use displayCurrency


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !isAdminUser) {
      // No explicit redirect here, the component will render the access denied message.
    }

  }, [user, isAdminUser, authLoading, router]);

  const totalTransactions = allPlatformExpenses.length;

  const totalExpenseValue = useMemo(() => {
    return allPlatformExpenses // Amounts are in base currency
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allPlatformExpenses]);

  const totalIncomeValue = useMemo(() => {
    return allPlatformExpenses // Amounts are in base currency
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allPlatformExpenses]);

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
    allPlatformExpenses // Amounts are in base currency
      .filter(e => e.type === 'expense')
      .forEach(expense => {
        categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
      });
    return Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [allPlatformExpenses]);

  const topSpendingCategory = spendingByCategory.length > 0 ? spendingByCategory[0] : { category: "N/A", total: 0 };

  const managementLinks = [
    { href: '/expenses', label: 'View My Transactions', icon: ListChecks, description: 'Access your personal transactions.' },
    { href: '/budgets', label: 'View My Budgets', icon: Target, description: 'Access your personal budgets.' },
    { href: '/admin/users', label: 'Manage Users', icon: Users, description: 'View platform users.' },
    { href: '/settings', label: 'App Settings', icon: Settings, description: 'Configure application-wide settings.' },
  ];

  if (authLoading || loadingAllPlatformExpenses || loadingAllPlatformBudgets || !settingsMounted) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading Admin Dashboard...</p>
        </div>
      </AppShell>
    );
  }

  if (!isAdminUser) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Card className="w-full max-w-md p-8 text-center shadow-xl">
            <CardHeader>
              <Lock className="h-16 w-16 text-destructive mx-auto mb-6" />
              <CardTitle className="text-3xl font-headline">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg mb-6">
                You do not have the necessary permissions to view this page.
                This area is restricted to administrators only.
              </p>
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href="/">Go to My Dashboard</Link>
              </Button>
            </CardContent>
             <CardDescription className="mt-4 text-xs text-muted-foreground">
                If you believe this is an error, please contact support or ensure your account has admin privileges.
             </CardDescription>
          </Card>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            Admin Dashboard
          </h1>
          {user && <p className="text-xs text-muted-foreground">Logged in as Admin: {user.email}</p>}
        </div>
        <p className="text-sm text-muted-foreground">
          Platform analytics (all amounts displayed in {displayCurrency}) and management overview.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Transactions</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">From 'expenses_all'</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              {/* Format for display */}
              <div className="text-3xl font-bold text-foreground">{formatCurrency(totalExpenseValue, displayCurrency)}</div>
               <p className="text-xs text-muted-foreground">Sum from 'expenses_all'</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
               {/* Format for display */}
              <div className="text-3xl font-bold text-foreground">{formatCurrency(totalIncomeValue, displayCurrency)}</div>
               <p className="text-xs text-muted-foreground">Sum from 'expenses_all'</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registered Users</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">N/A</div>
              <p className="text-xs text-muted-foreground">(See 'Manage Users')</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Quick Management</CardTitle>
            <CardDescription>Jump to key areas.</CardDescription>
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
                    Most Common Platform Category
                </CardTitle>
                <CardDescription>Expense category with the highest number of transactions (from 'expenses_all').</CardDescription>
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
                    Highest Spending Platform Category
                </CardTitle>
                <CardDescription>Expense category with the highest total spending (from 'expenses_all', displayed in {displayCurrency}).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold text-foreground">{topSpendingCategory.category}</div>
                 {/* Format for display */}
                <p className="text-sm text-muted-foreground">Total: {formatCurrency(topSpendingCategory.total, displayCurrency)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <CreditCard className="h-6 w-6 mr-3 text-primary" />
              Recent Platform Activity (from 'expenses_all')
            </CardTitle>
             <CardDescription>Latest transactions recorded across the platform (displayed in {displayCurrency}).</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList count={10} expensesData={allPlatformExpenses} />
          </CardContent>
        </Card>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Advanced Platform Analytics</CardTitle>
                <CardDescription>
                  The following analytics require backend processing (e.g., Cloud Functions) for efficient and scalable implementation.
                  They are not available with the current client-side setup.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
                <p className="font-medium text-foreground">Future Analytics (Require Backend):</p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                    <li>Most active users by transaction volume.</li>
                    <li>Total transaction amounts per client (daily, weekly, monthly summaries).</li>
                    <li>Collective client transaction statistics (e.g., platform-wide daily/weekly/monthly totals).</li>
                    <li>Average transactions per hour.</li>
                    <li>Real-time data streams for key metrics.</li>
                </ul>
                 <p className="mt-3 text-xs">
                  These features typically involve server-side aggregation of data from the 'users', 'expenses_all', and 'budgets_all' collections,
                  and potentially storing pre-calculated results for quick retrieval by the admin dashboard.
                </p>
            </CardContent>
          </Card>
      </div>
    </AppShell>
  );
}
