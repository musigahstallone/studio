
"use client";

import Link from 'next/link';
import { PiggyBank, Menu, X, LayoutGrid, Info, MessageSquare, Sun, Moon, Laptop, HelpCircleIcon, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import type { Theme } from '@/lib/types';

const mainNavItems = [
  { href: "/features", label: "Features", icon: LayoutGrid },
  { href: "/#how-it-works", label: "How It Works", icon: Info },
  { href: "/contact", label: "Contact", icon: MessageSquare },
];

const quickLinksSheetItems = [
  { href: "/features", label: "Features", icon: LayoutGrid },
  { href: "/#how-it-works", label: "How It Works", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircleIcon },
];

const legalSupportSheetItems = [
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Service", icon: FileText },
  // Contact Us is now in mainNavItems to avoid duplication
];


export function LandingHeader() {
  const { theme, setTheme, isMounted: settingsAreMounted } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!settingsAreMounted) return;

    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'system') {
      setTheme(isSystemDark ? 'light' : 'dark');
    } else if (theme === 'light') {
      setTheme('dark');
    } else { // theme === 'dark'
      setTheme('system');
    }
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;
  
  let nextThemeLabel = 'system';
  if (settingsAreMounted) { 
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'system') {
      nextThemeLabel = isSystemDark ? 'light' : 'dark';
    } else if (theme === 'light') {
      nextThemeLabel = 'dark';
    } else { // theme === 'dark'
      nextThemeLabel = 'system';
    }
  }
  const themeTooltip = `Switch to ${nextThemeLabel} mode`;

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
                       {/* The X close button from SheetContent itself will be used. Removed manual button. */}
                    </SheetHeader>
                    <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                      {mainNavItems.map((item) => (
                        <Button
                          variant="ghost"
                          asChild
                          key={`main-${item.href}`}
                          className="w-full justify-start text-base py-3 px-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href={item.href}>
                            <item.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                            {item.label}
                          </Link>
                        </Button>
                      ))}
                      
                      <Separator className="my-4" />
                      
                      <h4 className="px-3 text-sm font-medium text-muted-foreground mb-2">Quick Links</h4>
                      {quickLinksSheetItems.map((item) => (
                        <Button
                          variant="ghost"
                          asChild
                          key={`quick-${item.href}`}
                          className="w-full justify-start text-base py-3 px-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href={item.href}>
                            <item.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                            {item.label}
                          </Link>
                        </Button>
                      ))}

                      <Separator className="my-4" />

                      <h4 className="px-3 text-sm font-medium text-muted-foreground mb-2">Legal & Support</h4>
                      {legalSupportSheetItems.map((item) => (
                        <Button
                          variant="ghost"
                          asChild
                          key={`legal-${item.href}`}
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
