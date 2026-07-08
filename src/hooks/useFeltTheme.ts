import { useEffect, useState } from 'react';

const FELT_THEME_KEY = 'chrome:felt-theme';
const FELT_THEME_CLASS = 'pf-v6-theme-felt';

const readFeltThemePreference = (): boolean => {
  try {
    return localStorage.getItem(FELT_THEME_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeFeltThemePreference = (enabled: boolean): void => {
  try {
    localStorage.setItem(FELT_THEME_KEY, String(enabled));
  } catch {
    // no-op: persistence unavailable
  }
};

const applyFeltTheme = (enabled: boolean) => {
  if (enabled) {
    document.documentElement.classList.add(FELT_THEME_CLASS);
  } else {
    document.documentElement.classList.remove(FELT_THEME_CLASS);
  }
};

const getInitialFeltTheme = (forceEnabled: boolean): boolean => {
  if (forceEnabled) {
    applyFeltTheme(true);
    return true;
  }
  const enabled = readFeltThemePreference();
  applyFeltTheme(enabled);
  return enabled;
};

export const useFeltTheme = (forceEnabled = false) => {
  const [isFeltTheme, setIsFeltTheme] = useState<boolean>(() => getInitialFeltTheme(forceEnabled));

  useEffect(() => {
    if (forceEnabled) {
      setIsFeltTheme(true);
      applyFeltTheme(true);
    } else {
      const saved = readFeltThemePreference();
      setIsFeltTheme(saved);
      applyFeltTheme(saved);
    }
  }, [forceEnabled]);

  const setFeltEnabled = () => {
    if (forceEnabled) return;
    setIsFeltTheme(true);
    applyFeltTheme(true);
    writeFeltThemePreference(true);
  };

  const setFeltDisabled = () => {
    if (!forceEnabled) {
      setIsFeltTheme(false);
      applyFeltTheme(false);
      writeFeltThemePreference(false);
    }
  };

  return { isFeltTheme, setFeltEnabled, setFeltDisabled, forceEnabled };
};

export default useFeltTheme;
