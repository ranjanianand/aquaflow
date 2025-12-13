'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeVariant = 'vercel' | 'industrial';
export type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeVariant: ThemeVariant;
  colorMode: ColorMode;
  setThemeVariant: (variant: ThemeVariant) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleThemeVariant: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_VARIANT_KEY = 'aquaflow-theme-variant';
const COLOR_MODE_KEY = 'aquaflow-color-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeVariant, setThemeVariantState] = useState<ThemeVariant>('vercel');
  const [colorMode, setColorModeState] = useState<ColorMode>('light');
  const [mounted, setMounted] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedVariant = localStorage.getItem(THEME_VARIANT_KEY) as ThemeVariant | null;
    const savedColorMode = localStorage.getItem(COLOR_MODE_KEY) as ColorMode | null;

    if (savedVariant && ['vercel', 'industrial'].includes(savedVariant)) {
      setThemeVariantState(savedVariant);
    }

    if (savedColorMode && ['light', 'dark', 'system'].includes(savedColorMode)) {
      setColorModeState(savedColorMode);
    }

    setMounted(true);
  }, []);

  // Apply theme variant class to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-vercel', 'theme-industrial');

    // Add current theme class
    root.classList.add(`theme-${themeVariant}`);

    // Save to localStorage
    localStorage.setItem(THEME_VARIANT_KEY, themeVariant);
  }, [themeVariant, mounted]);

  // Apply color mode
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    const applyColorMode = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (colorMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyColorMode(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyColorMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyColorMode(colorMode === 'dark');
    }

    localStorage.setItem(COLOR_MODE_KEY, colorMode);
  }, [colorMode, mounted]);

  const setThemeVariant = useCallback((variant: ThemeVariant) => {
    setThemeVariantState(variant);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  const toggleThemeVariant = useCallback(() => {
    setThemeVariantState((prev) => (prev === 'vercel' ? 'industrial' : 'vercel'));
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        themeVariant,
        colorMode,
        setThemeVariant,
        setColorMode,
        toggleThemeVariant,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
