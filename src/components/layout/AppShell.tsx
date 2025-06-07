
"use client"; // Add "use client" if AppHeader or other children require it

import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { usePathname } from 'next/navigation'; // Import usePathname

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Don't render AppShell (which includes AppHeader) for the login page
  if (pathname === '/login') {
    return <>{children}</>; // Render children directly, e.g. the LoginPage content
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
