
"use client";

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'; // Imported useSidebar
import { PiggyBank } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  const { state: sidebarState, isMobile } = useSidebar();

  // Show app name in header if:
  // 1. On mobile (isMobile is true)
  // 2. Not on mobile AND sidebar is collapsed (icon-only view)
  const showAppNameInHeader = isMobile || (!isMobile && sidebarState === "collapsed");

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" /> {/* Hidden on md and up */}
        {showAppNameInHeader && (
          <Link href="/" className="flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
              PennyPincher AI
            </h1>
          </Link>
        )}
      </div>
      {/* Future user profile / settings button can go here */}
    </header>
  );
}

