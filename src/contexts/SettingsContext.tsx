
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  DEFAULT_DISPLAY_CURRENCY, 
  DEFAULT_THEME, 
  type CurrencyCode, 
  type Theme, 
  // type FontThemeId, // Commented out
  // DEFAULT_FONT_THEME_ID_CONST, // Commented out
  DEFAULT_LOCAL_CURRENCY 
} from '@/lib/types';
// import { fontPairings } from '@/lib/fonts'; // Commented out

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  // fontTheme: FontThemeId; // Commented out
  // setFontTheme: (fontThemeId: FontThemeId) => void; // Commented out
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (currency: CurrencyCode) => void;
  localCurrency: CurrencyCode;
  setLocalCurrency: (currency: CurrencyCode) => void;
  isMounted: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  // const [fontTheme, setFontThemeState] = useState<FontThemeId>(DEFAULT_FONT_THEME_ID_CONST); // Commented out
  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>(DEFAULT_DISPLAY_CURRENCY);
  const [localCurrency, setLocalCurrencyState] = useState<CurrencyCode>(DEFAULT_LOCAL_CURRENCY);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    // const storedFontTheme = localStorage.getItem('fontTheme') as FontThemeId | null; // Commented out
    const storedDisplayCurrency = localStorage.getItem('displayCurrency') as CurrencyCode | null;
    const storedLocalCurrency = localStorage.getItem('localCurrency') as CurrencyCode | null;

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

    /* // Font theme logic commented out
    if (storedFontTheme && fontPairings.some(fp => fp.id === storedFontTheme)) {
      setFontThemeState(storedFontTheme);
      applyFontThemeClass(storedFontTheme);
    } else {
      applyFontThemeClass(DEFAULT_FONT_THEME_ID_CONST);
    }
    */

    if (storedDisplayCurrency) {
      setDisplayCurrencyState(storedDisplayCurrency);
    }
    if (storedLocalCurrency) {
      setLocalCurrencyState(storedLocalCurrency);
    }
    setIsMounted(true);
  }, []);

  /* // Font theme logic commented out
  const applyFontThemeClass = (fontId: FontThemeId) => {
    fontPairings.forEach(fp => {
      document.documentElement.classList.remove(`font-theme-${fp.id}`);
    });
    document.documentElement.classList.add(`font-theme-${fontId}`);
  };
  */

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

  /* // Font theme logic commented out
  const setFontTheme = useCallback((newFontId: FontThemeId) => {
    setFontThemeState(newFontId);
    localStorage.setItem('fontTheme', newFontId);
    applyFontThemeClass(newFontId);
  }, []);
  */

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
      // fontTheme, setFontTheme, // Commented out
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
  // Provide dummy/default values for fontTheme and setFontTheme if they are accessed
  // This part of the context is effectively deprecated with the UI changes
  return {
    ...context,
    // fontTheme: DEFAULT_FONT_THEME_ID_CONST as FontThemeId, // Provide a default if needed elsewhere
    // setFontTheme: () => {}, // No-op function
  } as SettingsContextType; // Cast to ensure type compatibility
};
