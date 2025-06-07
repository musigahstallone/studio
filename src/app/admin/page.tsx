
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses, useBudgets } from '@/contexts/ExpenseContext'; // Now useBudgets is also from ExpenseContext
import { useMemo, useEffect } from 'react'; // Added useEffect
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, TrendingDown, TrendingUp, Target, Tag, CreditCard, BarChart3, Users, ListChecks, Settings, ArrowRight } from 'lucide-react';
// import { useRouter } from 'next/navigation'; // For potential redirect

// Placeholder for admin check. In a real app, this would come from an auth context/hook.
const IS_ADMIN_DEMO = true; 

export default function AdminDashboardPage() {
  // const router = useRouter(); // For potential redirect
  const { allPlatformExpenses } = useExpenses(); // Use allPlatformExpenses for admin view
  const { allPlatformBudgets } = useBudgets(); // Use allPlatformBudgets for admin view

  useEffect(() => {
    if (!IS_ADMIN_DEMO) {
      console.warn("Access Denied: User is not an admin (demo). This page would be restricted.");
      // router.push('/'); // Example: redirect non-admins
      // For now, we'll just log and allow content for demonstration
    }
  }, []);


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

  const activeBudgetsCount = allPlatformBudgets.length;

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
  
  // For now, mock user count as it's not implemented
  // In a real app, this would come from a users collection in Firestore.
  const mockUserCount = 53; // Kept for display, real count would be dynamic


  const managementLinks = [
    { href: '/expenses', label: 'View My Transactions', icon: ListChecks, description: 'Access your personal transactions.' },
    { href: '/budgets', label: 'View My Budgets', icon: Target, description: 'Access your personal budgets.' },
    { href: '/admin/users', label: 'Manage Users', icon: Users, description: 'View platform users (mock data, admin only).' },
    { href: '/settings', label: 'App Settings', icon: Settings, description: 'Configure application-wide settings.' },
  ];

  if (!IS_ADMIN_DEMO) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full">
          <Card className="w-full max-w-md p-8 text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You do not have permission to view this page.</p>
              <Button asChild className="mt-6">
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </CardContent>
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
        </div>
        <p className="text-sm text-muted-foreground">
          Platform analytics and management overview.
          <span className="italic"> (Note: Data reflects combined mock data. Real multi-user backend & advanced analytics would require further Firebase integration.)</span>
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Transactions</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Across all users (mock)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalExpenseValue.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">Sum of all expenses (mock)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalIncomeValue.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">Sum of all income (mock)</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registered Users</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockUserCount}</div>
              <p className="text-xs text-muted-foreground">(Mock data - from user list page)</p>
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
                <CardDescription>Expense category with the highest number of transactions (all mock users).</CardDescription>
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
                <CardDescription>Expense category with the highest total spending (all mock users).</CardDescription>
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
              Recent Platform Activity (All Mock Users)
            </CardTitle>
             <CardDescription>Latest transactions recorded across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* The RecentTransactionsList internally uses useExpenses, which is now user-scoped.
                We need to pass allPlatformExpenses to it for the admin view.
                Or, create a version of RecentTransactionsList for admin.
                For now, let's use count=0 to avoid showing user-specific data here if RecentTransactionsList
                is not modified to accept an explicit list.
                A better solution would be to make RecentTransactionsList accept an optional 'expenses' prop.
            */}
            <RecentTransactionsList count={10} expensesData={allPlatformExpenses} />
          </CardContent>
        </Card>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    Future Admin Analytics
                </CardTitle>
                <CardDescription>Placeholders for more advanced analytics that would require full Firebase integration and backend logic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
                <p>- Most active users by transaction volume.</p>
                <p>- Total transaction amounts per client (daily, weekly, monthly).</p>
                <p>- Collective client transaction statistics (this month, week, day).</p>
                <p>- Average transactions per hour.</p>
                <p>- Real-time data streams.</p>
            </CardContent>
          </Card>
        
      </div>
    </AppShell>
  );
}
