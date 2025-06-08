
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  DEFAULT_DISPLAY_CURRENCY, 
  DEFAULT_THEME, 
  type CurrencyCode, 
  type Theme, 
  DEFAULT_LOCAL_CURRENCY 
} from '@/lib/types';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (currency: CurrencyCode) => void;
  localCurrency: CurrencyCode;
  setLocalCurrency: (currency: CurrencyCode) => void;
  isMounted: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme based on localStorage or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return DEFAULT_THEME; // Fallback for server-side or environments without window
  });

  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>(DEFAULT_DISPLAY_CURRENCY);
  const [localCurrency, setLocalCurrencyState] = useState<CurrencyCode>(DEFAULT_LOCAL_CURRENCY);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs on mount to sync localStorage and apply initial class
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    let initialTheme: Theme;

    if (storedTheme === 'light' || storedTheme === 'dark') {
      initialTheme = storedTheme;
    } else {
      initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setThemeState(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    
    const storedDisplayCurrency = localStorage.getItem('displayCurrency') as CurrencyCode | null;
    const storedLocalCurrency = localStorage.getItem('localCurrency') as CurrencyCode | null;

    if (storedDisplayCurrency) setDisplayCurrencyState(storedDisplayCurrency);
    if (storedLocalCurrency) setLocalCurrencyState(storedLocalCurrency);
    
    setIsMounted(true);
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }, []);

  const setDisplayCurrency = useCallback((newCurrency: CurrencyCode) => {
    setDisplayCurrencyState(newCurrency);
    localStorage.setItem('displayCurrency', newCurrency);
  }, []);

  const setLocalCurrency = useCallback((newCurrency: CurrencyCode) => {
    setLocalCurrencyState(newCurrency);
    localStorage.setItem('localCurrency', newCurrency);
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      theme, setTheme, 
      displayCurrency, setDisplayCurrency,
      localCurrency, setLocalCurrency,
      isMounted 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
