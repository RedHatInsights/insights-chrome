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
