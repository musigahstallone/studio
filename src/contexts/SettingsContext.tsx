
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DEFAULT_CURRENCY, DEFAULT_THEME, type CurrencyCode, type Theme, type FontThemeId, DEFAULT_FONT_THEME_ID_CONST } from '@/lib/types';
import { fontPairings } from '@/lib/fonts'; // Assuming fontPairings and DEFAULT_FONT_THEME_ID are here

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontTheme: FontThemeId;
  setFontTheme: (fontThemeId: FontThemeId) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  isMounted: boolean; // To help avoid hydration mismatches on initial load
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [fontTheme, setFontThemeState] = useState<FontThemeId>(DEFAULT_FONT_THEME_ID_CONST);
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedFontTheme = localStorage.getItem('fontTheme') as FontThemeId | null;
    const storedCurrency = localStorage.getItem('currency') as CurrencyCode | null;

    if (storedTheme) {
      setThemeState(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (storedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else { // system
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } else { // Default to system if no theme stored
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

    if (storedCurrency) {
      setCurrencyState(storedCurrency);
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
    } else { // system
      // Remove explicit dark/light, let CSS media query take over
      document.documentElement.classList.remove('dark'); 
      // Re-apply based on system preference immediately
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

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  }, []);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, fontTheme, setFontTheme, currency, setCurrency, isMounted }}>
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
