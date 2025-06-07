
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { UserList } from '@/components/admin/UserList';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase'; 
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';


export default function AdminUsersPage() {
  const { user, isAdminUser, loading: authLoading } = useAuth(); // Use isAdminUser
  const router = useRouter();
  const [fetchedUsers, setFetchedUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
     if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    // If auth has loaded, user is present, but not an admin
    if (!authLoading && user && !isAdminUser) {
      // Let the UI below handle "Access Denied"
    }
  }, [user, isAdminUser, authLoading, router]);

  useEffect(() => {
    // Fetch users only if auth has loaded and the current user is an admin
    if (!authLoading && isAdminUser) { 
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const usersCol = collection(db, 'users');
          const q = query(usersCol, orderBy('joinDate', 'desc')); 
          const userSnapshot = await getDocs(q);
          const userList = userSnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamp to ISO string for joinDate
            let joinDateStr: string | undefined = undefined;
            if (data.joinDate && (data.joinDate as Timestamp).toDate) {
                joinDateStr = (data.joinDate as Timestamp).toDate().toISOString().split('T')[0];
            } else if (typeof data.joinDate === 'string') {
                joinDateStr = data.joinDate;
            }

            return { 
              uid: doc.id, 
              name: data.name,
              email: data.email,
              photoURL: data.photoURL,
              joinDate: joinDateStr,
              isAdmin: data.isAdmin === true, // Directly use the isAdmin field
            } as AppUser;
          });
          setFetchedUsers(userList);
        } catch (error) {
          console.error("Error fetching users:", error);
          setFetchedUsers([]);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    } else if (!authLoading && !isAdminUser) { // If not admin after loading, stop loading users
        setIsLoadingUsers(false); 
    }
  }, [isAdminUser, authLoading]);


  if (authLoading) { // Only show main loader if auth is loading
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading User Management...</p>
        </div>
      </AppShell>
    );
  }

  // After auth loading, if not admin, show access denied
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
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Platform Users</CardTitle>
            <CardDescription>
              Overview of registered users fetched from Firestore 'users' collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? ( // This loader is specific to fetching users
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading users...</p>
              </div>
            ) : fetchedUsers.length > 0 ? (
              <UserList users={fetchedUsers} />
            ) : (
              <p className="text-muted-foreground text-center py-4">No users found in the database.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
