
"use client";

import Link from 'next/link';
import { PiggyBank, Menu, X, LayoutGrid, Info, MessageSquare, Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import type { Theme } from '@/lib/types';

const navItems = [
  { href: "/features", label: "Features", icon: LayoutGrid },
  { href: "/#how-it-works", label: "How It Works", icon: Info },
  { href: "/contact", label: "Contact", icon: MessageSquare },
];

export function LandingHeader() {
  const { user, loading } = useAuth();
  const { theme, setTheme, isMounted: settingsAreMounted } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;
  const themeTooltip = `Switch to ${
    theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
  } mode`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <PiggyBank className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
            PennyPincher AI
          </h1>
        </Link>

        {hasMounted && (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Button variant="ghost" asChild key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {settingsAreMounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label={themeTooltip}
                  title={themeTooltip}
                >
                  <ThemeIcon className="h-5 w-5" />
                </Button>
              )}

              {/* Mobile Navigation Trigger */}
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
                    <SheetHeader className="p-4 border-b">
                      <SheetTitle className="flex items-center gap-2">
                        <PiggyBank className="h-7 w-7 text-primary" />
                        <span className="font-headline text-xl font-semibold tracking-tight text-foreground">PennyPincher AI</span>
                      </SheetTitle>
                      <button
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-label="Close menu"
                        >
                          <X className="h-5 w-5" />
                          <span className="sr-only">Close</span>
                        </button>
                    </SheetHeader>
                    <nav className="flex-grow p-4 space-y-2">
                      {navItems.map((item) => (
                        <Button
                          variant="ghost"
                          asChild
                          key={item.href}
                          className="w-full justify-start text-base py-3 px-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href={item.href}>
                            <item.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                            {item.label}
                          </Link>
                        </Button>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
