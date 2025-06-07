
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  DEFAULT_DISPLAY_CURRENCY, 
  DEFAULT_THEME, 
  type CurrencyCode, 
  type Theme, 
  type FontThemeId, 
  DEFAULT_FONT_THEME_ID_CONST,
  DEFAULT_LOCAL_CURRENCY // Import new default
} from '@/lib/types';
import { fontPairings } from '@/lib/fonts';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontTheme: FontThemeId;
  setFontTheme: (fontThemeId: FontThemeId) => void;
  displayCurrency: CurrencyCode; // Renamed for clarity
  setDisplayCurrency: (currency: CurrencyCode) => void; // Renamed for clarity
  localCurrency: CurrencyCode; // New: for input
  setLocalCurrency: (currency: CurrencyCode) => void; // New: for input
  isMounted: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [fontTheme, setFontThemeState] = useState<FontThemeId>(DEFAULT_FONT_THEME_ID_CONST);
  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>(DEFAULT_DISPLAY_CURRENCY);
  const [localCurrency, setLocalCurrencyState] = useState<CurrencyCode>(DEFAULT_LOCAL_CURRENCY); // New state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedFontTheme = localStorage.getItem('fontTheme') as FontThemeId | null;
    const storedDisplayCurrency = localStorage.getItem('displayCurrency') as CurrencyCode | null;
    const storedLocalCurrency = localStorage.getItem('localCurrency') as CurrencyCode | null; // New: load local currency

    if (storedTheme) {
      setThemeState(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (storedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else { 
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } else {
       if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    }

    if (storedFontTheme && fontPairings.some(fp => fp.id === storedFontTheme)) {
      setFontThemeState(storedFontTheme);
      applyFontThemeClass(storedFontTheme);
    } else {
      applyFontThemeClass(DEFAULT_FONT_THEME_ID_CONST);
    }

    if (storedDisplayCurrency) {
      setDisplayCurrencyState(storedDisplayCurrency);
    }
    if (storedLocalCurrency) { // New: set local currency
      setLocalCurrencyState(storedLocalCurrency);
    }
    setIsMounted(true);
  }, []);

  const applyFontThemeClass = (fontId: FontThemeId) => {
    fontPairings.forEach(fp => {
      document.documentElement.classList.remove(`font-theme-${fp.id}`);
    });
    document.documentElement.classList.add(`font-theme-${fontId}`);
  };

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('dark'); 
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const setFontTheme = useCallback((newFontId: FontThemeId) => {
    setFontThemeState(newFontId);
    localStorage.setItem('fontTheme', newFontId);
    applyFontThemeClass(newFontId);
  }, []);

  const setDisplayCurrency = useCallback((newCurrency: CurrencyCode) => {
    setDisplayCurrencyState(newCurrency);
    localStorage.setItem('displayCurrency', newCurrency);
  }, []);

  const setLocalCurrency = useCallback((newCurrency: CurrencyCode) => { // New function
    setLocalCurrencyState(newCurrency);
    localStorage.setItem('localCurrency', newCurrency);
  }, []);

  return (
    <SettingsContext.Provider value={{ 
      theme, setTheme, 
      fontTheme, setFontTheme, 
      displayCurrency, setDisplayCurrency,
      localCurrency, setLocalCurrency, // Provide new state and setter
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
