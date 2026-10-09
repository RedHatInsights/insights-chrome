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

const getInitialFeltTheme = (autoEnabled: boolean): boolean => {
  if (autoEnabled) {
    applyFeltTheme(true);
    return true;
  }
  const enabled = readFeltThemePreference();
  applyFeltTheme(enabled);
  return enabled;
};

/**
 * Hook managing the Felt theme CSS class and localStorage persistence.
 *
 * @param autoEnabled When true (driven by the `platform.chrome-felt-auto`
 *   feature flag), Felt is applied automatically and the manual toggle
 *   callbacks become no-ops.  The user's localStorage preference is left
 *   untouched so it takes effect again when the flag is later disabled.
 */
export const useFeltTheme = (autoEnabled = false) => {
  const [isFeltTheme, setIsFeltTheme] = useState<boolean>(() => getInitialFeltTheme(autoEnabled));

  useEffect(() => {
    if (autoEnabled) {
      setIsFeltTheme(true);
      applyFeltTheme(true);
    } else {
      const saved = readFeltThemePreference();
      setIsFeltTheme(saved);
      applyFeltTheme(saved);
    }
  }, [autoEnabled]);

  const setFeltEnabled = () => {
    if (autoEnabled) return;
    setIsFeltTheme(true);
    applyFeltTheme(true);
    writeFeltThemePreference(true);
  };

  const setFeltDisabled = () => {
    if (autoEnabled) return;
    setIsFeltTheme(false);
    applyFeltTheme(false);
    writeFeltThemePreference(false);
  };

  return { isFeltTheme, setFeltEnabled, setFeltDisabled, forceEnabled: autoEnabled };
};
