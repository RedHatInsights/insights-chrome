import { useEffect, useState } from 'react';
import { useFlag, useFlagsStatus } from '@unleash/proxy-client-react';
import { getDarkModeStore, useDarkModeStore } from '../state/stores/darkModeStore';
import { THEME_STORAGE_KEY } from '../utils/consts';

// Force webpack to treat useDarkModeStore as a used export so the module cache
// includes it when remote modules load it via Module Federation.
void useDarkModeStore;

export enum ThemeVariants {
  light = 'light',
  dark = 'dark',
  system = 'system',
}

export const useTheme = () => {
  const isDarkModeEnabled = useFlag('platform.chrome.dark-mode');
  const isDarkModeSystemEnabled = useFlag('platform.chrome.dark-mode_system');
  const { flagsReady, flagsError } = useFlagsStatus();
  const flagsResolved = flagsReady || !!flagsError;

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('pf-v6-theme-dark');
    } else {
      document.documentElement.classList.remove('pf-v6-theme-dark');
    }
    // Sync dark mode state to scalprum shared store for remote modules
    const darkModeStore = getDarkModeStore();
    darkModeStore.updateState(isDark ? 'SET_DARK' : 'SET_LIGHT');
  };

  const getInitialTheme = (): ThemeVariants => {
    if (!isDarkModeEnabled) {
      applyTheme(false);
      return ThemeVariants.light;
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === ThemeVariants.dark) {
      applyTheme(true);
      return ThemeVariants.dark;
    } else if (savedTheme === ThemeVariants.light) {
      applyTheme(false);
      return ThemeVariants.light;
    } else if (isDarkModeSystemEnabled && savedTheme === ThemeVariants.system) {
      // System mode - use media query
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      return ThemeVariants.system;
    } else if (isDarkModeSystemEnabled) {
      // Default to system mode
      localStorage.setItem(THEME_STORAGE_KEY, ThemeVariants.system);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      return ThemeVariants.system;
    }

    // If no theme has been selected defaults to light mode
    applyTheme(false);
    return ThemeVariants.light;
  };

  // Preserve the saved mode while flags load without changing the pre-paint DOM theme.
  const getSavedThemeMode = (): ThemeVariants => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      return Object.values(ThemeVariants).find((variant) => variant === savedTheme) ?? ThemeVariants.light;
    } catch {
      return ThemeVariants.light;
    }
  };

  const [themeMode, setThemeMode] = useState<ThemeVariants>(() => (flagsResolved ? getInitialTheme() : getSavedThemeMode()));

  useEffect(() => {
    if (!flagsResolved) return;
    const newTheme = getInitialTheme();
    setThemeMode(newTheme);
  }, [isDarkModeEnabled, isDarkModeSystemEnabled, flagsResolved]);

  const setLightMode = () => {
    setThemeMode(ThemeVariants.light);
    applyTheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, ThemeVariants.light);
  };

  const setDarkMode = () => {
    setThemeMode(ThemeVariants.dark);
    applyTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, ThemeVariants.dark);
  };

  const setSystemMode = () => {
    setThemeMode(ThemeVariants.system);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
    localStorage.setItem(THEME_STORAGE_KEY, ThemeVariants.system);
  };

  return {
    themeMode,
    setLightMode,
    setDarkMode,
    setSystemMode,
  };
};
