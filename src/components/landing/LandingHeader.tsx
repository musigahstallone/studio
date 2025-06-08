
"use client";

import Link from 'next/link';
import { PiggyBank, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export function LandingHeader() {
  const { theme, setTheme, isMounted: settingsAreMounted } = useSettings();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!settingsAreMounted) return;
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const ThemeIcon = theme === 'light' ? Moon : Sun;
  const themeTooltip = `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <PiggyBank className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
            PennyPincher AI
          </h1>
        </Link>

        {hasMounted && settingsAreMounted && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={themeTooltip}
              title={themeTooltip}
            >
              <ThemeIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
