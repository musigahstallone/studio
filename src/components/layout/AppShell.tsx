
"use client";

import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation'; // Import useRouter
import { useEffect } from 'react'; // Import useEffect

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's no user, redirect to login
    // This protects all pages wrapped by AppShell
    if (!loading && !user && pathname !== '/login') { // Ensure we are not already on login
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  // Don't render AppShell for public pages or login page
  if (pathname === '/login' || pathname === '/' || pathname === '/privacy' || pathname === '/terms' || pathname === '/contact') {
    return <>{children}</>; 
  }
  
  // If still loading auth state, or if no user and redirect hasn't happened, show a loader or null
  // This prevents flashing AppHeader for users who will be redirected
  if (loading || !user) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

    