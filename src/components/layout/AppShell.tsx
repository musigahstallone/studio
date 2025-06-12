
"use client";

import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { usePathname, useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      const searchParamsString = searchParams.toString();
      const fullPath = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
      
      sessionStorage.setItem('intendedPath', fullPath);
      sessionStorage.setItem('loginReason', 'authRedirect'); 

      router.push('/login');
    }
  }, [user, loading, router, pathname, searchParams]); // Added searchParams to dependency array

  if (pathname === '/login' || pathname === '/' || pathname === '/privacy' || pathname === '/terms' || pathname === '/contact' || pathname === '/features' || pathname === '/faq') {
    return <>{children}</>; 
  }
  
  if (loading || (!user && pathname !== '/login')) { 
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

