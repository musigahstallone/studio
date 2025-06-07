
"use client";

import { Button } from '@/components/ui/button';
import { Moon, Sun, Laptop } from 'lucide-react'; // Added Laptop for system theme
import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Theme } from '@/lib/types';

export function ThemeSwitcher() {
  const { theme, setTheme, isMounted } = useSettings();

  if (!isMounted) {
    // Render a placeholder or null during server rendering/initial hydration
    return (
        <div className="flex flex-col space-y-2">
            <Label htmlFor="theme-select" className="text-sm font-medium">
                Theme
            </Label>
            <div className="h-10 w-full sm:w-auto bg-muted rounded-md animate-pulse" />
            <p className="text-xs text-muted-foreground">Loading theme...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="theme-select" className="text-sm font-medium">
        Theme
      </Label>
      <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
        <SelectTrigger className="w-full sm:w-auto" id="theme-select" aria-label="Select theme">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center">
              <Sun className="mr-2 h-4 w-4" /> Light
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center">
              <Moon className="mr-2 h-4 w-4" /> Dark
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center">
              <Laptop className="mr-2 h-4 w-4" /> System
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
       <p className="text-xs text-muted-foreground">
        Current theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}.
      </p>
    </div>
  );
}
