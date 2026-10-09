export type ColorSchemeSetting = 'dark' | 'light' | 'system';
export type ContrastModeSetting = 'default' | 'high-contrast' | 'glass' | 'system';
export type ColorSchemeRendered = 'dark' | 'light';
export type ContrastModeRendered = 'default' | 'high-contrast' | 'glass';
export type ThemeTelemetryDefaults = {
  colorSchemeSetting?: ColorSchemeSetting;
  contrastModeSetting?: ContrastModeSetting;
};

export const THEME_TELEMETRY_PREFERENCES_CHANGE = 'chrome:theme-telemetry-preferences-change';

const COLOR_SCHEME_STORAGE_KEY = 'chrome:theme';
const HIGH_CONTRAST_STORAGE_KEY = 'chrome:high-contrast';
const GLASS_THEME_STORAGE_KEY = 'chrome:glass-theme';
const DARK_THEME_CLASS = 'pf-v6-theme-dark';
const HIGH_CONTRAST_THEME_CLASS = 'pf-v6-theme-high-contrast';
const GLASS_THEME_CLASS = 'pf-v6-theme-glass';

const readPreference = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const getThemeTelemetrySettings = (
  defaults: ThemeTelemetryDefaults = {}
): {
  colorSchemeSetting?: ColorSchemeSetting;
  contrastModeSetting?: ContrastModeSetting;
} => {
  const savedColorScheme = readPreference(COLOR_SCHEME_STORAGE_KEY);
  const colorSchemeSetting: ColorSchemeSetting | undefined =
    savedColorScheme === null
      ? (defaults.colorSchemeSetting ?? 'light')
      : ['dark', 'light', 'system'].includes(savedColorScheme)
        ? (savedColorScheme as ColorSchemeSetting)
        : undefined;

  const savedContrastMode = readPreference(HIGH_CONTRAST_STORAGE_KEY);
  const glassEnabled = readPreference(GLASS_THEME_STORAGE_KEY) === 'true';
  let contrastModeSetting: ContrastModeSetting | undefined;
  if (glassEnabled) {
    contrastModeSetting = 'glass';
  } else if (savedContrastMode === null) {
    contrastModeSetting = defaults.contrastModeSetting ?? 'default';
  } else if (savedContrastMode === 'default') {
    contrastModeSetting = 'default';
  } else if (savedContrastMode === 'high') {
    contrastModeSetting = 'high-contrast';
  } else if (savedContrastMode === 'system') {
    contrastModeSetting = 'system';
  }

  return {
    ...(colorSchemeSetting ? { colorSchemeSetting } : {}),
    ...(contrastModeSetting ? { contrastModeSetting } : {}),
  };
};

export const getThemeTelemetryRendered = (): {
  colorSchemeRendered: ColorSchemeRendered;
  contrastModeRendered?: ContrastModeRendered;
} => {
  const rootClasses = typeof document === 'undefined' ? undefined : document.documentElement.classList;
  const isHighContrast = rootClasses?.contains(HIGH_CONTRAST_THEME_CLASS) ?? false;
  const isGlass = rootClasses?.contains(GLASS_THEME_CLASS) ?? false;

  return {
    colorSchemeRendered: rootClasses?.contains(DARK_THEME_CLASS) ? 'dark' : 'light',
    // Both classes together represent an invalid HCC theme state. Omit this
    // property until the UI returns to one of the supported contrast modes.
    ...(isHighContrast && isGlass ? {} : { contrastModeRendered: isHighContrast ? 'high-contrast' : isGlass ? 'glass' : 'default' }),
  };
};

export const notifyThemeTelemetryPreferencesChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(THEME_TELEMETRY_PREFERENCES_CHANGE));
  }
};
