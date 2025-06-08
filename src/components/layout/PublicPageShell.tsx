
"use client";

import type { ReactNode } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

interface PublicPageShellProps {
  children: ReactNode;
}

export function PublicPageShell({ children }: PublicPageShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}

    