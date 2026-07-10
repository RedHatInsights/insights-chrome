import { useEffect, useState } from 'react';

const GLASS_THEME_KEY = 'chrome:glass-theme';
const GLASS_THEME_CLASS = 'pf-v6-theme-glass';

const readGlassThemePreference = (): boolean => {
  try {
    return localStorage.getItem(GLASS_THEME_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeGlassThemePreference = (checked: boolean): void => {
  try {
    localStorage.setItem(GLASS_THEME_KEY, String(checked));
  } catch {
    // no-op: persistence unavailable
  }
};

const applyGlassTheme = (enabled: boolean) => {
  if (enabled) {
    document.documentElement.classList.add(GLASS_THEME_CLASS);
  } else {
    document.documentElement.classList.remove(GLASS_THEME_CLASS);
  }
};

const getInitialGlassTheme = (isEnabled: boolean, forceEnabled: boolean): boolean => {
  if (forceEnabled) {
    applyGlassTheme(true);
    return true;
  }
  if (!isEnabled) {
    applyGlassTheme(false);
    return false;
  }
  const enabled = readGlassThemePreference();
  applyGlassTheme(enabled);
  return enabled;
};

export const useGlassTheme = (isEnabled: boolean, forceEnabled = false) => {
  const [isGlassTheme, setIsGlassTheme] = useState<boolean>(() => getInitialGlassTheme(isEnabled, forceEnabled));

  useEffect(() => {
    if (forceEnabled) {
      setIsGlassTheme(true);
      applyGlassTheme(true);
    } else if (!isEnabled) {
      setIsGlassTheme(false);
      applyGlassTheme(false);
    } else {
      const saved = readGlassThemePreference();
      setIsGlassTheme(saved);
      applyGlassTheme(saved);
    }
  }, [isEnabled, forceEnabled]);

  const enableGlass = () => {
    setIsGlassTheme(true);
    applyGlassTheme(true);
    writeGlassThemePreference(true);
  };

  const disableGlass = () => {
    setIsGlassTheme(false);
    applyGlassTheme(false);
    writeGlassThemePreference(false);
  };

  const toggleGlassTheme = (_event: unknown, checked: boolean) => {
    if (checked) {
      enableGlass();
    } else {
      disableGlass();
    }
  };

  return { isGlassTheme, toggleGlassTheme, enableGlass, disableGlass };
};
