import { useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { getDarkModeStore, useDarkModeStore } from '../state/stores/darkModeStore';

// Force webpack to treat useDarkModeStore as a used export so the module cache
// includes it when remote modules load it via Module Federation.
void useDarkModeStore;

export enum ThemeVariants {
  light,
  dark,
  system,
}

export const useTheme = () => {
  const isDarkModeEnabled = useFlag('platform.chrome.dark-mode');
  const isDarkModeSystemEnabled = useFlag('platform.chrome.dark-mode_system');

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

    const savedTheme = localStorage.getItem('chrome:theme');

    if (savedTheme === 'dark') {
      applyTheme(true);
      return ThemeVariants.dark;
    } else if (savedTheme === 'light') {
      applyTheme(false);
      return ThemeVariants.light;
    } else if (isDarkModeSystemEnabled && savedTheme === 'system') {
      // System mode - use media query
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      return ThemeVariants.system;
    } else if (isDarkModeSystemEnabled) {
      // Default to system mode
      localStorage.setItem('chrome:theme', 'system');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      return ThemeVariants.system;
    }

    // If no theme has been selected defaults to light mode
    applyTheme(false);
    return ThemeVariants.light;
  };

  const [themeMode, setThemeMode] = useState<ThemeVariants>(getInitialTheme);

  useEffect(() => {
    const newTheme = getInitialTheme();
    setThemeMode(newTheme);
  }, [isDarkModeEnabled, isDarkModeSystemEnabled]);

  const setLightMode = () => {
    setThemeMode(ThemeVariants.light);
    applyTheme(false);
    localStorage.setItem('chrome:theme', 'light');
  };

  const setDarkMode = () => {
    setThemeMode(ThemeVariants.dark);
    applyTheme(true);
    localStorage.setItem('chrome:theme', 'dark');
  };

  const setSystemMode = () => {
    setThemeMode(ThemeVariants.system);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
    localStorage.setItem('chrome:theme', 'system');
  };

  return {
    themeMode,
    setLightMode,
    setDarkMode,
    setSystemMode,
  };
};
