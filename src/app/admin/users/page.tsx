
"use client";

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { UserList } from '@/components/admin/UserList';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminUsersPage() {
  const { isAdminUser } = useAuth();
  const { toast } = useToast();
  const [fetchedUsers, setFetchedUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!isAdminUser) {
      setIsLoadingUsers(false);
      return;
    }
    setIsLoadingUsers(true);
    try {
      const usersCol = collection(db, 'users');
      const q = query(usersCol, orderBy('joinDate', 'desc'));
      const userSnapshot = await getDocs(q);

      const userListPromises = userSnapshot.docs.map(async (docSnapshot) => {
        const userData = docSnapshot.data();
        const userId = docSnapshot.id;
        let transactionCount = 0;
        let totalSpent = 0;

        try {
          const expensesColRef = collection(db, 'users', userId, 'expenses');
          const expensesSnapshot = await getDocs(expensesColRef);
          transactionCount = expensesSnapshot.size;
          expensesSnapshot.forEach(expDoc => {
            const expData = expDoc.data();
            if (expData.type === 'expense' && typeof expData.amount === 'number') {
              totalSpent += expData.amount; // amount is in base currency (USD)
            }
          });
        } catch (userExpenseError) {
          console.error(`Error fetching expenses for user ${userId}:`, userExpenseError);
          // Keep transactionCount and totalSpent as 0 if fetching fails
        }
        
        let joinDateStr: string | undefined = undefined;
        if (userData.joinDate && (userData.joinDate as Timestamp).toDate) {
            joinDateStr = (userData.joinDate as Timestamp).toDate().toISOString().split('T')[0];
        } else if (typeof userData.joinDate === 'string') {
            const parsedDate = new Date(userData.joinDate);
            if (!isNaN(parsedDate.getTime())) {
                joinDateStr = parsedDate.toISOString().split('T')[0];
            } else {
                joinDateStr = userData.joinDate; // Fallback to original string if unparsable
            }
        }

        return {
          uid: userId,
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL,
          joinDate: joinDateStr,
          isAdmin: userData.isAdmin === true,
          transactionCount,
          totalSpent,
        } as AppUser;
      });

      const userList = await Promise.all(userListPromises);
      setFetchedUsers(userList);

      if (isRefreshing) {
        toast({ title: "User List Refreshed", description: `${userList.length} users loaded.`});
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ variant: "destructive", title: "Error Fetching Users", description: "Could not load user data."});
      setFetchedUsers([]);
    } finally {
      setIsLoadingUsers(false);
      setIsRefreshing(false);
    }
  }, [isAdminUser, toast, isRefreshing]);

  useEffect(() => {
    if (isAdminUser) {
      fetchUsers();
    } else {
        setIsLoadingUsers(false);
    }
  }, [isAdminUser, fetchUsers]);

  const handleRefreshUsers = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            User Management
          </h1>
          <Button onClick={handleRefreshUsers} variant="outline" disabled={isLoadingUsers || isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Users"}
          </Button>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Platform Users</CardTitle>
            <CardDescription>
              Overview of registered users. Transaction and spending data is calculated on load.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers && !isRefreshing ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading users...</p>
              </div>
            ) : fetchedUsers.length > 0 ? (
              <UserList users={fetchedUsers} />
            ) : (
              <p className="text-muted-foreground text-center py-4">No users found or failed to load.</p>
            )}
          </CardContent>
        </Card>
         <Card className="shadow-lg bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/30">
            <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-400">Performance Note</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                    Displaying real-time transaction counts and total spending for each user requires fetching all transactions for each user listed. 
                    This client-side calculation can be slow and resource-intensive for a large number of users or transactions.
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300 mt-2">
                    For production applications, it is highly recommended to pre-calculate and store these aggregates (e.g., using Cloud Functions) on each user's document for better performance and scalability.
                </p>
            </CardContent>
          </Card>
      </div>
    </AdminShell>
  );
}
