
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { UserList } from '@/components/admin/UserList';
import type { AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase'; // Import db
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'; // Import Firestore functions

// Mock data generation function - REMOVED as we will fetch from Firestore
// const generateMockUsers = (count: number): AppUser[] => { ... };

// Simplified admin check - this should be more robust in production
// For now, use the same logic as admin/page.tsx or implement checkIsAdmin from Firestore
// const IS_ADMIN_DEMO_FLAG = true; 

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [fetchedUsers, setFetchedUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true); // Renamed for clarity
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdminStatus, setCheckingAdminStatus] = useState(true);

  useEffect(() => {
     if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    // Admin status check (mirroring admin/page.tsx logic for consistency)
    const verifyAdminStatus = async () => {
      if (user?.uid) {
        // Example admin check: Replace with your actual logic (e.g., custom claims or Firestore role)
        if (user.email === 'admin@example.com' || user.uid === 'YOUR_ADMIN_UID_HERE') { 
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
         setIsAdmin(false);
      }
      setCheckingAdminStatus(false);
    };
    
    if (!authLoading && user) {
       verifyAdminStatus();
    } else if (!authLoading && !user) {
       setIsAdmin(false);
       setCheckingAdminStatus(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isAdmin && !authLoading) { // Only fetch if admin and auth is resolved
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const usersCol = collection(db, 'users');
          const q = query(usersCol, orderBy('joinDate', 'desc')); // Assuming joinDate is a Timestamp
          const userSnapshot = await getDocs(q);
          const userList = userSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
              uid: doc.id, 
              ...data,
              // Convert Firestore Timestamp to ISO string for joinDate if necessary
              joinDate: (data.joinDate as Timestamp)?.toDate ? (data.joinDate as Timestamp).toDate().toISOString().split('T')[0] : data.joinDate as string,
            } as AppUser;
          });
          setFetchedUsers(userList);
        } catch (error) {
          console.error("Error fetching users:", error);
          setFetchedUsers([]); // Set to empty on error
          // Optionally, show a toast message
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    } else if (!checkingAdminStatus && !authLoading && !isAdmin) {
        setIsLoadingUsers(false); // Stop loading if not admin
    }
  }, [isAdmin, authLoading, checkingAdminStatus]);


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
              <p className="text-muted-foreground">You do not have permission to view this page.</p>
              <Button asChild className="mt-6">
                <Link href="/admin">Back to Admin Dashboard</Link>
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
