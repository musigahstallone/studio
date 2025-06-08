
"use client";

import { useEffect, useState, useCallback } from 'react';
// No useRouter for login redirect, AdminShell handles it.
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { UserList } from '@/components/admin/UserList';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Needed for isAdminUser to pass to fetchUsers if it were dependent

// Note: AdminShell now handles the primary auth/admin checks and loading/denied states.
// This page component assumes it will only be rendered if the user is an authenticated admin.

export default function AdminUsersPage() {
  const { isAdminUser } = useAuth(); // Get isAdminUser for fetchUsers logic
  const { toast } = useToast();
  const [fetchedUsers, setFetchedUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!isAdminUser) { // Should not happen if AdminShell works, but good guard
      setIsLoadingUsers(false);
      return;
    }
    setIsLoadingUsers(true);
    try {
      const usersCol = collection(db, 'users');
      const q = query(usersCol, orderBy('joinDate', 'desc'));
      const userSnapshot = await getDocs(q);
      const userList = userSnapshot.docs.map(doc => {
        const data = doc.data();
        let joinDateStr: string | undefined = undefined;
        if (data.joinDate && (data.joinDate as Timestamp).toDate) {
            joinDateStr = (data.joinDate as Timestamp).toDate().toISOString().split('T')[0];
        } else if (typeof data.joinDate === 'string') {
            const parsedDate = new Date(data.joinDate);
            if (!isNaN(parsedDate.getTime())) {
                joinDateStr = parsedDate.toISOString().split('T')[0];
            } else {
                joinDateStr = data.joinDate;
            }
        }
        return {
          uid: doc.id,
          name: data.name,
          email: data.email,
          photoURL: data.photoURL,
          joinDate: joinDateStr,
          isAdmin: data.isAdmin === true,
        } as AppUser;
      });
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
  }, [isAdminUser, toast, isRefreshing]); // Added isAdminUser dependency

  useEffect(() => {
    // Fetch users only if confirmed admin by AuthContext (which AdminShell also uses)
    if (isAdminUser) {
      fetchUsers();
    } else {
        setIsLoadingUsers(false); // Stop loading if somehow rendered without admin rights
    }
  }, [isAdminUser, fetchUsers]);

  const handleRefreshUsers = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  // AdminShell handles the main loading spinner and access denied message.
  // This component will only render its content if the user is an admin.

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
              Overview of registered users. Ensure user data is in the 'users' collection.
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
      </div>
    </AdminShell>
  );
}
