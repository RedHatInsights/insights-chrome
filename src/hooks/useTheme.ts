import { useState } from 'react';

export const useTheme = () => {
  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('pf-v6-theme-dark');
    } else {
      document.documentElement.classList.remove('pf-v6-theme-dark');
    }
  };

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const savedTheme = localStorage.getItem('chrome:theme');

    if (savedTheme === 'dark') {
      applyTheme(true);
      return 'dark';
    } else if (savedTheme === 'light') {
      applyTheme(false);
      return 'light';
    } else {
      // System mode - use media query
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
      localStorage.setItem('chrome:theme', 'system');
      return 'system';
    }
  });

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
