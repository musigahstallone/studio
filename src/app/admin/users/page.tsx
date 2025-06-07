
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { UserList } from '@/components/admin/UserList';
import type { AppUser } from '@/lib/types'; // Changed to AppUser
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // For admin check potentially
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// import { db } from '@/lib/firebase';
// import { collection, getDocs } from 'firebase/firestore';

// Mock data generation - kept for now to populate the list for demo
// In a real app, this data would be fetched from Firestore 'users' collection.
const generateMockUsers = (count: number): AppUser[] => {
  const users: AppUser[] = [];
  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Ian", "Julia", "Ken", "Laura", "Mike", "Nora", "Oscar"];
  const lastNames = ["Smith", "Jones", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const joinYear = 2020 + Math.floor(Math.random() * 5); 
    const joinMonth = Math.floor(Math.random() * 12) + 1;
    const joinDay = Math.floor(Math.random() * 28) + 1; 

    users.push({
      uid: `mock-user-${i + 1001}`, 
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random()*100)}@example.com`,
      joinDate: `${joinYear}-${String(joinMonth).padStart(2, '0')}-${String(joinDay).padStart(2, '0')}`,
      transactionCount: Math.floor(Math.random() * 200),
      totalSpent: parseFloat((Math.random() * 5000).toFixed(2)),
      isAdmin: Math.random() < 0.1, 
      photoURL: `https://placehold.co/40x40.png?text=${firstName.charAt(0)}${lastName.charAt(0)}`
    });
  }
  return users.sort((a,b) => new Date(b.joinDate!).getTime() - new Date(a.joinDate!).getTime());
};

// Simplified admin check for now
const IS_ADMIN_DEMO_FLAG = true; 

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [fetchedUsers, setFetchedUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdminStatus, setCheckingAdminStatus] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user && IS_ADMIN_DEMO_FLAG) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setCheckingAdminStatus(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      // Simulate fetching users
      // In a real app: fetch users from Firestore
      // const fetchUsers = async () => {
      //   const usersCol = collection(db, 'users');
      //   const userSnapshot = await getDocs(usersCol);
      //   const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
      //   setFetchedUsers(userList);
      //   setIsLoading(false);
      // };
      // fetchUsers().catch(console.error);
      console.log("AdminUsersPage: Would fetch users from Firebase 'users' collection here.");
      const mockUsers = generateMockUsers(25); 
      setFetchedUsers(mockUsers);
      setIsLoading(false);
    } else if (!checkingAdminStatus && !authLoading) { // If not admin and status check is done
        setIsLoading(false); // Stop loading if not admin
    }
  }, [isAdmin, checkingAdminStatus, authLoading]);


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
              Overview of registered users. (Currently mock data. Real integration would fetch from a 'users' collection in Firestore.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading users...</p>
              </div>
            ) : fetchedUsers.length > 0 ? (
              <UserList users={fetchedUsers} />
            ) : (
              <p className="text-muted-foreground text-center py-4">No users found or accessible.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
