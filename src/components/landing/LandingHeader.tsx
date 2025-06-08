
"use client";

import Link from 'next/link';
import { PiggyBank, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext'; // To hide login if authenticated

export function LandingHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <PiggyBank className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
            PennyPincher AI
          </h1>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/#features">Features</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/contact">Contact</Link>
          </Button>
          {!loading && !user && (
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login / Sign Up
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

    