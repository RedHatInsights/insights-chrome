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

const getInitialFeltTheme = (autoEnabled: boolean, disabled: boolean): boolean => {
  if (disabled) {
    applyFeltTheme(false);
    return false;
  }
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
 * @param disabled When true (e.g. Glass is forced on a Lightwell route),
 *   Felt is kept off regardless of autoEnabled or saved preference.
 *   Prevents both theme classes coexisting on the document root.
 */
export const useFeltTheme = (autoEnabled = false, disabled = false) => {
  const [isFeltTheme, setIsFeltTheme] = useState<boolean>(() => getInitialFeltTheme(autoEnabled, disabled));

  useEffect(() => {
    if (disabled) {
      setIsFeltTheme(false);
      applyFeltTheme(false);
    } else if (autoEnabled) {
      setIsFeltTheme(true);
      applyFeltTheme(true);
    } else {
      const saved = readFeltThemePreference();
      setIsFeltTheme(saved);
      applyFeltTheme(saved);
    }
  }, [autoEnabled, disabled]);

  const setFeltEnabled = () => {
    if (autoEnabled || disabled) return;
    setIsFeltTheme(true);
    applyFeltTheme(true);
    writeFeltThemePreference(true);
  };

  const setFeltDisabled = () => {
    if (autoEnabled || disabled) return;
    setIsFeltTheme(false);
    applyFeltTheme(false);
    writeFeltThemePreference(false);
  };

  return { isFeltTheme, setFeltEnabled, setFeltDisabled };
};
