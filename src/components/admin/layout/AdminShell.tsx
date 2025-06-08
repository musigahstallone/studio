
"use client";

import type { ReactNode } from 'react';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';


interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, isAdminUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, isAdminUser, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted">
        <AdminHeader />
        <div className="flex flex-1 items-center justify-center w-full">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
         <AdminHeader />
         <div className="flex flex-1 items-center justify-center w-full p-4">
            <Card className="w-full max-w-md p-6 text-center shadow-xl">
                <CardHeader>
                <Lock className="h-16 w-16 text-destructive mx-auto mb-4" />
                <CardTitle className="text-2xl sm:text-3xl font-headline">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground text-md sm:text-lg mb-6">
                    You do not have permission to view this admin area.
                </p>
                <Button asChild className="w-full sm:w-auto" size="lg">
                    <Link href="/">Go to Dashboard</Link>
                </Button>
                </CardContent>
                <CardDescription className="mt-3 text-xs text-muted-foreground">
                    If you believe this is an error, contact platform support.
                </CardDescription>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <AdminHeader />
      <div className="flex flex-1 pt-16"> {/* pt-16 to offset fixed AdminHeader */}
        <AdminSidebar /> {/* Sidebar will hide itself on mobile */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto"> {/* Added md: for padding change */}
          {children}
        </main>
      </div>
    </div>
  );
}
