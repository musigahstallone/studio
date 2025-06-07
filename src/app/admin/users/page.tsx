
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { UserList } from '@/components/admin/UserList';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

// Mock data generation
const generateMockUsers = (count: number): User[] => {
  const users: User[] = [];
  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Ian", "Julia"];
  const lastNames = ["Smith", "Jones", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson"];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const joinYear = 2020 + Math.floor(Math.random() * 5); // 2020-2024
    const joinMonth = Math.floor(Math.random() * 12) + 1;
    const joinDay = Math.floor(Math.random() * 28) + 1; // Simple day generation

    users.push({
      id: `user-${i + 1001}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random()*100)}@example.com`,
      joinDate: `${joinYear}-${String(joinMonth).padStart(2, '0')}-${String(joinDay).padStart(2, '0')}`,
      transactionCount: Math.floor(Math.random() * 200),
      totalSpent: parseFloat((Math.random() * 5000).toFixed(2)),
    });
  }
  return users.sort((a,b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
};


export default function AdminUsersPage() {
  const [mockUsers, setMockUsers] = useState<User[]>([]);

  useEffect(() => {
    // Generate mock users on client-side to avoid hydration issues with random data
    setMockUsers(generateMockUsers(53)); // Generate 53 mock users
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
              Overview of registered users on the platform. (This is mock data for demonstration purposes).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mockUsers.length > 0 ? (
              <UserList users={mockUsers} />
            ) : (
              <p className="text-muted-foreground text-center py-4">Loading users...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
