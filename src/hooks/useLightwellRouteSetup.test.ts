import { afterEach, describe, expect, it } from '@jest/globals';

const THEME_CLASSES = ['pf-v6-theme-felt', 'pf-v6-theme-glass', 'lightwell-v1-theme'];

describe('useLightwellRouteSetup module preload', () => {
  afterEach(() => {
    document.documentElement.className = '';
    window.history.pushState({}, '', '/');
  });

  it.each(['/lightwell', '/lightwell/repositories', '/lightwell-next', '/lightwell-next/lens'])('adds Lightwell theme classes for %s', (pathname) => {
    window.history.pushState({}, '', pathname);
    document.documentElement.className = '';

    /* eslint-disable @typescript-eslint/no-require-imports */
    jest.isolateModules(() => {
      require('./useLightwellRouteSetup');
    });
    /* eslint-enable @typescript-eslint/no-require-imports */

    THEME_CLASSES.forEach((themeClass) => {
      expect(document.documentElement).toHaveClass(themeClass);
    });
  });

  it.each(['/insights/dashboard', '/lightwell-preview', '/lightwell-next-preview'])('does not add the Lightwell theme for %s', (pathname) => {
    window.history.pushState({}, '', pathname);
    document.documentElement.className = '';

    /* eslint-disable @typescript-eslint/no-require-imports */
    jest.isolateModules(() => {
      require('./useLightwellRouteSetup');
    });
    /* eslint-enable @typescript-eslint/no-require-imports */

    expect(document.documentElement).not.toHaveClass('pf-v6-theme-glass');
    expect(document.documentElement).not.toHaveClass('lightwell-v1-theme');
  });
});
