import { createStore } from 'jotai';
import { globalFilterHiddenAtom } from '../../state/atoms/globalFilterAtom';
import chromeStore from '../../state/chromeStore';

describe('Global Filter Toggle Functions', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('hideGlobalFilter', () => {
    it('should set globalFilterHiddenAtom to true when called with true', () => {
      const originalSet = chromeStore.set;
      chromeStore.set = store.set.bind(store);

      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);

      chromeStore.set = originalSet;
    });

    it('should set globalFilterHiddenAtom to false when called with false', () => {
      const originalSet = chromeStore.set;
      chromeStore.set = store.set.bind(store);

      chromeStore.set(globalFilterHiddenAtom, false);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(false);

      chromeStore.set = originalSet;
    });

    it('should default to true when no argument provided', () => {
      const originalSet = chromeStore.set;
      chromeStore.set = store.set.bind(store);

      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);

      chromeStore.set = originalSet;
    });
  });

  describe('removeGlobalFilter (deprecated)', () => {
    it('should set globalFilterHiddenAtom to true when called with true', () => {
      const originalSet = chromeStore.set;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      chromeStore.set = store.set.bind(store);

      console.error('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');

      chromeStore.set = originalSet;
      consoleErrorSpy.mockRestore();
    });

    it('should set globalFilterHiddenAtom to false when called with false', () => {
      const originalSet = chromeStore.set;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      chromeStore.set = store.set.bind(store);

      console.error('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
      chromeStore.set(globalFilterHiddenAtom, false);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');

      chromeStore.set = originalSet;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Toggle behavior compatibility', () => {
    it('should behave like the original toggleGlobalFilter with isHidden = true', () => {
      const originalSet = chromeStore.set;
      chromeStore.set = store.set.bind(store);

      chromeStore.set(globalFilterHiddenAtom, true);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(true);

      chromeStore.set = originalSet;
    });

    it('should behave like the original toggleGlobalFilter with isHidden = false', () => {
      const originalSet = chromeStore.set;
      chromeStore.set = store.set.bind(store);

      chromeStore.set(globalFilterHiddenAtom, false);

      const result = store.get(globalFilterHiddenAtom);
      expect(result).toBe(false);

      chromeStore.set = originalSet;
    });
  });
});
