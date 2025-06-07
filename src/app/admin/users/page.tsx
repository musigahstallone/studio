
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { UserList } from '@/components/admin/UserList';
import type { User } from '@/lib/types'; // User type updated to include uid
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

// Mock data generation - kept for now to populate the list for demo
// In a real app, this data would be fetched from Firestore.
const generateMockUsers = (count: number): User[] => {
  const users: User[] = [];
  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Ian", "Julia", "Ken", "Laura", "Mike", "Nora", "Oscar"];
  const lastNames = ["Smith", "Jones", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const joinYear = 2020 + Math.floor(Math.random() * 5); // 2020-2024
    const joinMonth = Math.floor(Math.random() * 12) + 1;
    const joinDay = Math.floor(Math.random() * 28) + 1; // Simple day generation

    users.push({
      uid: `mock-user-${i + 1001}`, // Changed id to uid
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random()*100)}@example.com`,
      joinDate: `${joinYear}-${String(joinMonth).padStart(2, '0')}-${String(joinDay).padStart(2, '0')}`,
      transactionCount: Math.floor(Math.random() * 200),
      totalSpent: parseFloat((Math.random() * 5000).toFixed(2)),
      isAdmin: Math.random() < 0.1, // Approx 10% chance of being an admin for demo
      photoURL: `https://placehold.co/40x40.png?text=${firstName.charAt(0)}${lastName.charAt(0)}`
    });
  }
  return users.sort((a,b) => new Date(b.joinDate!).getTime() - new Date(a.joinDate!).getTime());
};


export default function AdminUsersPage() {
  const [mockUsers, setMockUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching users
    // In a real app: fetch users from Firestore
    // e.g., const usersCol = collection(db, 'users'); getDocs(usersCol).then(...)
    console.log("AdminUsersPage: Would fetch users from Firebase here.");
    const users = generateMockUsers(25); // Generate 25 mock users
    setMockUsers(users);
    setIsLoading(false);
  }, []);

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
              Overview of registered users on the platform. (This is mock data. Real integration would fetch from Firebase.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-4">Loading users...</p>
            ) : mockUsers.length > 0 ? (
              <UserList users={mockUsers} />
            ) : (
              <p className="text-muted-foreground text-center py-4">No users found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
