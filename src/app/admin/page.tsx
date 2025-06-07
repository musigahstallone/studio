
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses, useBudgets } from '@/contexts/ExpenseContext';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useMemo, useEffect, useState } from 'react';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, TrendingDown, TrendingUp, Target, Tag, CreditCard, BarChart3, Users, ListChecks, Settings, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
// import { db } from '@/lib/firebase'; // For fetching user profile if needed for isAdmin
// import { doc, getDoc } from 'firebase/firestore';
// import type { AppUser } from '@/lib/types';

// For demo: this would come from custom claims or a roles collection in a real app
// You could fetch the AppUser profile here and check an `isAdmin` field.
// const checkIsAdmin = async (userId: string): Promise<boolean> => {
//   if (!userId) return false;
//   const userDocRef = doc(db, 'users', userId); // Assuming you have a 'users' collection for profiles
//   const userDocSnap = await getDoc(userDocRef);
//   if (userDocSnap.exists()) {
//     const userData = userDocSnap.data() as AppUser;
//     return userData.isAdmin === true;
//   }
//   return false; 
// };

// Simplified admin check for now
const IS_ADMIN_DEMO_FLAG = true; // Set this to false to test the access denied view.

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { allPlatformExpenses, loadingAllPlatformExpenses } = useExpenses(); 
  const { allPlatformBudgets, loadingAllPlatformBudgets } = useBudgets(); 
  
  const [isAdmin, setIsAdmin] = useState(false); // Placeholder for real admin check
  const [checkingAdminStatus, setCheckingAdminStatus] = useState(true);

  useEffect(() => {
    // Simulate admin check. In a real app, this would involve checking claims or a roles DB.
    // For now, we'll use the IS_ADMIN_DEMO_FLAG if a user is logged in.
    if (!authLoading) {
      if (user && IS_ADMIN_DEMO_FLAG) { // User must be logged in AND demo flag true
        setIsAdmin(true); 
      } else {
        setIsAdmin(false);
      }
      setCheckingAdminStatus(false);
    }
    // Example of how you might fetch admin status from a user profile:
    // const verifyAdmin = async () => {
    //   if (user?.uid) {
    //     const adminStatus = await checkIsAdmin(user.uid);
    //     setIsAdmin(adminStatus);
    //   } else {
    //     setIsAdmin(false);
    //   }
    //   setCheckingAdminStatus(false);
    // };
    // if (!authLoading) verifyAdmin();
  }, [user, authLoading]);

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
  
  // Mock user count is now dynamic from UserList page (though UserList itself is mock)
  // For a real count, you'd query your 'users' collection in Firestore.
  // const mockUserCount = 53; 

  const managementLinks = [
    { href: '/expenses', label: 'View My Transactions', icon: ListChecks, description: 'Access your personal transactions.' },
    { href: '/budgets', label: 'View My Budgets', icon: Target, description: 'Access your personal budgets.' },
    { href: '/admin/users', label: 'Manage Users', icon: Users, description: 'View platform users (mock data, admin only).' },
    { href: '/settings', label: 'App Settings', icon: Settings, description: 'Configure application-wide settings.' },
  ];

  if (authLoading || checkingAdminStatus || loadingAllPlatformExpenses || loadingAllPlatformBudgets) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading Admin Dashboard...</p>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Card className="w-full max-w-md p-8 text-center">
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-2xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You do not have permission to view this page. Please log in with an admin account.</p>
              <Button asChild className="mt-6">
                <Link href="/">Go to My Dashboard</Link>
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
          {user && <p className="text-xs text-muted-foreground">Logged in as: {user.email}</p>}
        </div>
        <p className="text-sm text-muted-foreground">
          Platform analytics and management overview.
          <span className="italic"> (Note: "Platform" data currently reflects all data in local Firestore cache for expenses_all/budgets_all collections. True multi-user analytics and secure admin data fetching require robust Firebase Rules and potentially Cloud Functions.)</span>
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Transactions</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Across 'expenses_all' collection</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalExpenseValue.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">Sum from 'expenses_all'</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalIncomeValue.toFixed(2)}</div>
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
              <p className="text-xs text-muted-foreground">(Requires 'users' collection query)</p>
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
                <CardDescription>Expense category with the highest total spending (from 'expenses_all').</CardDescription>
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
              Recent Platform Activity (from 'expenses_all')
            </CardTitle>
             <CardDescription>Latest transactions recorded across the platform concept collection.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactionsList count={10} expensesData={allPlatformExpenses} />
          </CardContent>
        </Card>
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-xl">
                    Future Admin Analytics
                </CardTitle>
                <CardDescription>Placeholders for more advanced analytics that would require full Firebase integration and backend logic (e.g., Cloud Functions, secure aggregation).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
                <p>- Most active users by transaction volume.</p>
                <p>- Total transaction amounts per client (daily, weekly, monthly).</p>
                <p>- Collective client transaction statistics (this month, week, day).</p>
                <p>- Average transactions per hour.</p>
                <p>- Real-time data streams for key metrics.</p>
            </CardContent>
          </Card>
        
      </div>
    </AppShell>
  );
}
