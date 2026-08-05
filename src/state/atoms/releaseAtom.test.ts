import { createStore } from 'jotai';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { layoutBannerHiddenAtom, layoutForceFeltThemeAtom, layoutForceGlassThemeAtom, layoutLightwellHeaderAtom } from './releaseAtom';

describe('Lightwell layout atoms', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('layoutBannerHiddenAtom should default to false on non-Lightwell paths', () => {
    expect(store.get(layoutBannerHiddenAtom)).toBe(false);
  });

  it('layoutForceGlassThemeAtom should default to false on non-Lightwell paths', () => {
    expect(store.get(layoutForceGlassThemeAtom)).toBe(false);
  });

  it('layoutForceFeltThemeAtom should default to false on non-Lightwell paths', () => {
    expect(store.get(layoutForceFeltThemeAtom)).toBe(false);
  });

  it('layoutLightwellHeaderAtom should default to false on non-Lightwell paths', () => {
    expect(store.get(layoutLightwellHeaderAtom)).toBe(false);
  });

  it('layoutLightwellHeaderAtom should be writable', () => {
    store.set(layoutLightwellHeaderAtom, true);
    expect(store.get(layoutLightwellHeaderAtom)).toBe(true);
  });

  it('layoutBannerHiddenAtom should be writable', () => {
    store.set(layoutBannerHiddenAtom, true);
    expect(store.get(layoutBannerHiddenAtom)).toBe(true);
  });

  it('layoutForceGlassThemeAtom should be writable', () => {
    store.set(layoutForceGlassThemeAtom, true);
    expect(store.get(layoutForceGlassThemeAtom)).toBe(true);
  });

  it('layoutForceFeltThemeAtom should be writable', () => {
    store.set(layoutForceFeltThemeAtom, true);
    expect(store.get(layoutForceFeltThemeAtom)).toBe(true);
  });

  it('each layout atom should be independent', () => {
    store.set(layoutLightwellHeaderAtom, true);
    expect(store.get(layoutBannerHiddenAtom)).toBe(false);
    expect(store.get(layoutForceGlassThemeAtom)).toBe(false);
    expect(store.get(layoutForceFeltThemeAtom)).toBe(false);
  });
});

describe('Lightwell layout atoms initialized from pathname', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('should default to true when pathname starts with /lightwell', () => {
    window.history.pushState({}, '', '/lightwell/some-page');

    /* eslint-disable @typescript-eslint/no-require-imports */
    jest.isolateModules(() => {
      const { layoutBannerHiddenAtom, layoutForceGlassThemeAtom, layoutForceFeltThemeAtom, layoutLightwellHeaderAtom } = require('./releaseAtom');
      const { createStore } = require('jotai');
      const store = createStore();

      expect(store.get(layoutBannerHiddenAtom)).toBe(true);
      expect(store.get(layoutForceGlassThemeAtom)).toBe(true);
      expect(store.get(layoutForceFeltThemeAtom)).toBe(true);
      expect(store.get(layoutLightwellHeaderAtom)).toBe(true);
    });
    /* eslint-enable @typescript-eslint/no-require-imports */
  });

  it('should default to false when pathname does not start with /lightwell', () => {
    window.history.pushState({}, '', '/insights/dashboard');

    /* eslint-disable @typescript-eslint/no-require-imports */
    jest.isolateModules(() => {
      const { layoutBannerHiddenAtom, layoutForceGlassThemeAtom, layoutForceFeltThemeAtom, layoutLightwellHeaderAtom } = require('./releaseAtom');
      const { createStore } = require('jotai');
      const store = createStore();

      expect(store.get(layoutBannerHiddenAtom)).toBe(false);
      expect(store.get(layoutForceGlassThemeAtom)).toBe(false);
      expect(store.get(layoutForceFeltThemeAtom)).toBe(false);
      expect(store.get(layoutLightwellHeaderAtom)).toBe(false);
    });
    /* eslint-enable @typescript-eslint/no-require-imports */
  });
});
