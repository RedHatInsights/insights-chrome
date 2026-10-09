import {
  THEME_TELEMETRY_PREFERENCES_CHANGE,
  getThemeTelemetryRendered,
  getThemeTelemetrySettings,
  notifyThemeTelemetryPreferencesChanged,
} from './themeTelemetry';

describe('theme telemetry helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('uses the Chrome defaults when preferences have not been saved', () => {
    expect(getThemeTelemetrySettings()).toEqual({ colorSchemeSetting: 'light', contrastModeSetting: 'default' });
  });

  it('uses supplied feature-flag defaults when preferences have not been saved', () => {
    expect(getThemeTelemetrySettings({ colorSchemeSetting: 'system', contrastModeSetting: 'system' })).toEqual({
      colorSchemeSetting: 'system',
      contrastModeSetting: 'system',
    });
  });

  it.each([
    ['dark', 'high', 'dark', 'high-contrast'],
    ['system', 'system', 'system', 'system'],
    ['light', 'default', 'light', 'default'],
  ])('maps saved preferences %s / %s', (colorScheme, contrast, expectedColorScheme, expectedContrast) => {
    localStorage.setItem('chrome:theme', colorScheme);
    localStorage.setItem('chrome:high-contrast', contrast);

    expect(getThemeTelemetrySettings()).toEqual({ colorSchemeSetting: expectedColorScheme, contrastModeSetting: expectedContrast });
  });

  it('reports glass when the glass preference is enabled', () => {
    localStorage.setItem('chrome:high-contrast', 'default');
    localStorage.setItem('chrome:glass-theme', 'true');

    expect(getThemeTelemetrySettings().contrastModeSetting).toBe('glass');
  });

  it('omits invalid stored preferences', () => {
    localStorage.setItem('chrome:theme', 'sepia');
    localStorage.setItem('chrome:high-contrast', 'invalid');

    expect(getThemeTelemetrySettings()).toEqual({});
  });

  it.each([
    ['pf-v6-theme-dark', 'pf-v6-theme-glass', { colorSchemeRendered: 'dark', contrastModeRendered: 'glass' }],
    ['pf-v6-theme-dark', 'pf-v6-theme-high-contrast', { colorSchemeRendered: 'dark', contrastModeRendered: 'high-contrast' }],
    ['', '', { colorSchemeRendered: 'light', contrastModeRendered: 'default' }],
  ])('maps rendered theme classes', (colorClass, contrastClass, expected) => {
    document.documentElement.classList.add(...[colorClass, contrastClass].filter(Boolean));

    expect(getThemeTelemetryRendered()).toEqual(expected);
  });

  it('omits contrast telemetry when invalid overlapping classes are present', () => {
    document.documentElement.classList.add('pf-v6-theme-high-contrast', 'pf-v6-theme-glass');

    expect(getThemeTelemetryRendered()).toEqual({ colorSchemeRendered: 'light' });
  });

  it('notifies listeners when theme preferences change', () => {
    const listener = jest.fn();
    window.addEventListener(THEME_TELEMETRY_PREFERENCES_CHANGE, listener);

    notifyThemeTelemetryPreferencesChanged();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(THEME_TELEMETRY_PREFERENCES_CHANGE, listener);
  });
});
