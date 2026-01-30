import { globalFilterHiddenAtom, isGlobalFilterDisabledAtom } from '../globalFilterAtom';
import { activeModuleAtom } from '../activeModuleAtom';
import { createStore } from 'jotai';

describe('globalFilterAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('globalFilterHiddenAtom', () => {
    it('should have default value of false (not hidden)', () => {
      const value = store.get(globalFilterHiddenAtom);
      expect(value).toBe(false);
    });

    it('should be able to set to true (hidden)', () => {
      store.set(globalFilterHiddenAtom, true);
      const value = store.get(globalFilterHiddenAtom);
      expect(value).toBe(true);
    });

    it('should be able to set to false (not hidden)', () => {
      store.set(globalFilterHiddenAtom, true);
      store.set(globalFilterHiddenAtom, false);
      const value = store.get(globalFilterHiddenAtom);
      expect(value).toBe(false);
    });

    it('should be able to toggle between states', () => {
      expect(store.get(globalFilterHiddenAtom)).toBe(false);

      store.set(globalFilterHiddenAtom, true);
      expect(store.get(globalFilterHiddenAtom)).toBe(true);

      store.set(globalFilterHiddenAtom, false);
      expect(store.get(globalFilterHiddenAtom)).toBe(false);
    });
  });

  describe('isGlobalFilterDisabledAtom', () => {
    it('should be true when globalFilterHiddenAtom is true', () => {
      store.set(globalFilterHiddenAtom, true);
      store.set(activeModuleAtom, 'some-module');

      const isDisabled = store.get(isGlobalFilterDisabledAtom);
      expect(isDisabled).toBe(true);
    });

    it('should be true when activeModuleAtom is undefined/falsy', () => {
      store.set(globalFilterHiddenAtom, false);
      store.set(activeModuleAtom, undefined);

      const isDisabled = store.get(isGlobalFilterDisabledAtom);
      expect(isDisabled).toBe(true);
    });

    it('should be false when globalFilterHiddenAtom is false and activeModuleAtom has value', () => {
      store.set(globalFilterHiddenAtom, false);
      store.set(activeModuleAtom, 'some-module');

      const isDisabled = store.get(isGlobalFilterDisabledAtom);
      expect(isDisabled).toBe(false);
    });

    it('should be true when both globalFilterHiddenAtom is true and activeModuleAtom is undefined', () => {
      store.set(globalFilterHiddenAtom, true);
      store.set(activeModuleAtom, undefined);

      const isDisabled = store.get(isGlobalFilterDisabledAtom);
      expect(isDisabled).toBe(true);
    });

    it('should react to changes in globalFilterHiddenAtom', () => {
      store.set(activeModuleAtom, 'some-module');

      store.set(globalFilterHiddenAtom, false);
      expect(store.get(isGlobalFilterDisabledAtom)).toBe(false);

      store.set(globalFilterHiddenAtom, true);
      expect(store.get(isGlobalFilterDisabledAtom)).toBe(true);

      store.set(globalFilterHiddenAtom, false);
      expect(store.get(isGlobalFilterDisabledAtom)).toBe(false);
    });

    it('should react to changes in activeModuleAtom', () => {
      store.set(globalFilterHiddenAtom, false);

      store.set(activeModuleAtom, undefined);
      expect(store.get(isGlobalFilterDisabledAtom)).toBe(true);

      store.set(activeModuleAtom, 'some-module');
      expect(store.get(isGlobalFilterDisabledAtom)).toBe(false);

      store.set(activeModuleAtom, undefined);
      expect(store.get(isGlobalFilterDisabledAtom)).toBe(true);
    });
  });
});
