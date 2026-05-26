import React, { useEffect, useState } from 'react';

const GLASS_THEME_KEY = 'chrome:glass-theme';
const GLASS_THEME_CLASS = 'pf-v6-theme-glass';

const applyGlassTheme = (enabled: boolean) => {
  if (enabled) {
    document.documentElement.classList.add(GLASS_THEME_CLASS);
  } else {
    document.documentElement.classList.remove(GLASS_THEME_CLASS);
  }
};

const getInitialGlassTheme = (isEnabled: boolean): boolean => {
  if (!isEnabled) {
    applyGlassTheme(false);
    return false;
  }
  const saved = localStorage.getItem(GLASS_THEME_KEY);
  const enabled = saved === 'true';
  applyGlassTheme(enabled);
  return enabled;
};

export const useGlassTheme = (isEnabled: boolean) => {
  const [isGlassTheme, setIsGlassTheme] = useState<boolean>(() => getInitialGlassTheme(isEnabled));

  useEffect(() => {
    if (!isEnabled) {
      setIsGlassTheme(false);
      applyGlassTheme(false);
    } else {
      const saved = localStorage.getItem(GLASS_THEME_KEY) === 'true';
      setIsGlassTheme(saved);
      applyGlassTheme(saved);
    }
  }, [isEnabled]);

  const toggleGlassTheme = (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    setIsGlassTheme(checked);
    applyGlassTheme(checked);
    localStorage.setItem(GLASS_THEME_KEY, String(checked));
  };

  return { isGlassTheme, toggleGlassTheme };
};
