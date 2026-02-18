import { useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';

export const useTheme = () => {
  const isDarkModeEnabled = useFlag('platform.chrome.dark-mode');

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('pf-v6-theme-dark');
    } else {
      document.documentElement.classList.remove('pf-v6-theme-dark');
    }
  };

  const getInitialTheme = (): 'light' | 'dark' | 'system' => {
    if (!isDarkModeEnabled) {
      applyTheme(false);
      return 'light';
    }

    const savedTheme = localStorage.getItem('chrome:theme');

    if (savedTheme === 'dark') {
      applyTheme(true);
      return 'dark';
    } else if (savedTheme === 'light') {
      applyTheme(false);
      return 'light';
    } else if (savedTheme === 'system') {
      // System mode - use media query
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      return 'system';
    } else {
      // Default to system mode
      localStorage.setItem('chrome:theme', 'system');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      return 'system';
    }
  };

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(getInitialTheme);

  useEffect(() => {
    const newTheme = getInitialTheme();
    setThemeMode(newTheme);
  }, [isDarkModeEnabled]);

  const setLightMode = () => {
    setThemeMode('light');
    applyTheme(false);
    localStorage.setItem('chrome:theme', 'light');
  };

  const setDarkMode = () => {
    setThemeMode('dark');
    applyTheme(true);
    localStorage.setItem('chrome:theme', 'dark');
  };

  const setSystemMode = () => {
    setThemeMode('system');
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
