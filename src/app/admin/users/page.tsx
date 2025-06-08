
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { UserList } from '@/components/admin/UserList';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase'; 
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';


export default function AdminUsersPage() {
  const { user, isAdminUser, loading: authLoading } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  const [fetchedUsers, setFetchedUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!isAdminUser) {
      setIsLoadingUsers(false); // Ensure loading stops if not admin
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
  }, [isAdminUser, toast, isRefreshing]);

  useEffect(() => {
     if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && !isAdminUser) {
      // UI handles "Access Denied"
    }
  }, [user, isAdminUser, authLoading, router]);

  useEffect(() => {
    if (!authLoading && isAdminUser) { 
      fetchUsers();
    } else if (!authLoading && !isAdminUser) { 
        setIsLoadingUsers(false); 
    }
  }, [isAdminUser, authLoading, fetchUsers]);

  const handleRefreshUsers = () => {
    setIsRefreshing(true);
    fetchUsers();
  };


  if (authLoading) { 
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading User Management...</p>
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
              </p>
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href="/admin">Back to Admin Dashboard</Link>
              </Button>
            </CardContent>
             <CardDescription className="mt-4 text-xs text-muted-foreground">
                This section is restricted to administrators.
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
            Manage Users
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
              Overview of registered users. Transaction counts and spending per user are mock values.
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
    </AppShell>
  );
}

    