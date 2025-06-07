
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

// Define your admin email or a more robust check here
const ADMIN_EMAIL = 'admin@example.com'; // Replace with your actual admin email

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [fetchedUsers, setFetchedUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [checkingAdminStatus, setCheckingAdminStatus] = useState(true);

  useEffect(() => {
     if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    const verifyAdminStatus = async () => {
      if (user) {
        // Replace with your actual admin checking logic
        setIsAdminUser(user.email === ADMIN_EMAIL);
      } else {
         setIsAdminUser(false);
      }
      setCheckingAdminStatus(false);
    };
    
    if (!authLoading && user) {
       verifyAdminStatus();
    } else if (!authLoading && !user) {
       setIsAdminUser(false);
       setCheckingAdminStatus(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isAdminUser && !authLoading && !checkingAdminStatus) { 
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const usersCol = collection(db, 'users');
          // Consider adding isAdmin field to AppUser and sorting/filtering by it if needed
          const q = query(usersCol, orderBy('joinDate', 'desc')); 
          const userSnapshot = await getDocs(q);
          const userList = userSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
              uid: doc.id, 
              ...data,
              joinDate: (data.joinDate as Timestamp)?.toDate ? (data.joinDate as Timestamp).toDate().toISOString().split('T')[0] : data.joinDate as string,
              // isAdmin might be part of the user doc, or determined by claims (more advanced)
              isAdmin: data.isAdmin === true || data.email === ADMIN_EMAIL, // Example: admin status from doc OR email match
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
    } else if (!checkingAdminStatus && !authLoading && !isAdminUser) {
        setIsLoadingUsers(false); 
    }
  }, [isAdminUser, authLoading, checkingAdminStatus]);


  if (authLoading || checkingAdminStatus) {
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
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Platform Users</CardTitle>
            <CardDescription>
              Overview of registered users fetched from Firestore 'users' collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
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
```