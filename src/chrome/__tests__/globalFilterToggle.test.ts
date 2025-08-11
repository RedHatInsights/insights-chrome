import { createStore } from 'jotai';
import { globalFilterHiddenAtom } from '../../state/atoms/globalFilterAtom';
import chromeStore from '../../state/chromeStore';

describe('Global Filter Toggle Functions', () => {
  let store: ReturnType<typeof createStore>;
  let chromeStoreSetSpy: jest.SpyInstance;

  beforeEach(() => {
    store = createStore();
    chromeStoreSetSpy = jest.spyOn(chromeStore, 'set').mockImplementation(store.set.bind(store));
  });

  afterEach(() => {
    chromeStoreSetSpy.mockRestore();
  });

  describe('hideGlobalFilter', () => {
    it('should set globalFilterHiddenAtom to true when called with true', () => {
      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);
    });

    it('should set globalFilterHiddenAtom to false when called with false', () => {
      chromeStore.set(globalFilterHiddenAtom, false);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(false);
    });

    it('should default to true when no argument provided', () => {
      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);
    });
  });

  describe('removeGlobalFilter (deprecated)', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should set globalFilterHiddenAtom to true when called with true', () => {
      console.error('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
    });

    it('should set globalFilterHiddenAtom to false when called with false', () => {
      console.error('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
      chromeStore.set(globalFilterHiddenAtom, false);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
    });
  });

  describe('Toggle behavior compatibility', () => {
    it('should behave like the original toggleGlobalFilter with isHidden = true', () => {
      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);
    });

    it('should behave like the original toggleGlobalFilter with isHidden = false', () => {
      chromeStore.set(globalFilterHiddenAtom, false);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(false);
    });
  });
});
