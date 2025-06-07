
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState('light'); // Default to light

  // Effect to read theme from localStorage and apply it
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // If no stored theme, use system preference
      if (prefersDark) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="theme-toggle" className="text-sm font-medium">
        Theme
      </Label>
      <Button
        id="theme-toggle"
        variant="outline"
        onClick={toggleTheme}
        className="w-full sm:w-auto justify-start"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Sun className="mr-2 h-4 w-4" />
        ) : (
          <Moon className="mr-2 h-4 w-4" />
        )}
        <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
      </Button>
       <p className="text-xs text-muted-foreground">
        Current theme: {theme === 'light' ? 'Light' : 'Dark'}.
      </p>
    </div>
  );
}
