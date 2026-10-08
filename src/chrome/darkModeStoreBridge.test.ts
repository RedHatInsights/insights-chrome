import { renderHook, act } from '@testing-library/react';

jest.mock('@scalprum/core', () => ({
  getCachedModule: jest.fn(),
  getModule: jest.fn(),
  preloadModule: jest.fn(),
}));

jest.mock('@scalprum/react-core', () => ({
  useModule: jest.fn(),
}));

import { getCachedModule, getModule, preloadModule } from '@scalprum/core';
import { useModule } from '@scalprum/react-core';
import {
  _resetDarkModeStoreBridge,
  getCachedDarkModeStore,
  loadDarkModeStore,
  preloadDarkModeStore,
  useDarkModeStoreRef,
  useDarkModeIsDark,
} from './darkModeStoreBridge';

const mockGetModule = jest.mocked(getModule);
const mockGetCachedModule = jest.mocked(getCachedModule);
const mockPreloadModule = jest.mocked(preloadModule);
const mockUseModule = jest.mocked(useModule);

const SCOPE = 'chrome';
const MODULE = './theme/useDarkModeStore';
const IMPORT_NAME = 'getDarkModeStore';

describe('darkModeStoreBridge', () => {
  const mockStore = {
    getState: jest.fn(() => ({ isDark: false })),
    updateState: jest.fn(),
    subscribe: jest.fn(),
    subscribeAll: jest.fn(),
  };
  const mockGetDarkModeStore = jest.fn(() => mockStore);

  beforeEach(() => {
    jest.clearAllMocks();
    _resetDarkModeStoreBridge();
    mockGetCachedModule.mockReturnValue({ cachedModule: undefined });
  });

  describe('loadDarkModeStore', () => {
    it('should load the store through the chrome federated remote', async () => {
      mockGetModule.mockResolvedValue(mockGetDarkModeStore);

      const store = await loadDarkModeStore();

      expect(mockGetModule).toHaveBeenCalledWith(SCOPE, MODULE, IMPORT_NAME);
      expect(store).toBe(mockStore);
    });

    it('should memoize the store promise', async () => {
      mockGetModule.mockResolvedValue(mockGetDarkModeStore);

      const [store1, store2] = await Promise.all([loadDarkModeStore(), loadDarkModeStore()]);

      expect(mockGetModule).toHaveBeenCalledTimes(1);
      expect(store1).toBe(store2);
    });

    it('should clear the memo on failure so retries work', async () => {
      mockGetModule.mockRejectedValueOnce(new Error('load failed'));

      await expect(loadDarkModeStore()).rejects.toThrow('load failed');

      mockGetModule.mockResolvedValueOnce(mockGetDarkModeStore);
      const store = await loadDarkModeStore();
      expect(store).toBe(mockStore);
      expect(mockGetModule).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCachedDarkModeStore', () => {
    it('should return the store when the module is cached', () => {
      mockGetCachedModule.mockReturnValue({
        cachedModule: { [IMPORT_NAME]: mockGetDarkModeStore },
      });

      const store = getCachedDarkModeStore();

      expect(mockGetCachedModule).toHaveBeenCalledWith(SCOPE, MODULE);
      expect(store).toBe(mockStore);
    });

    it('should return undefined when the module is not cached', () => {
      mockGetCachedModule.mockReturnValue({ cachedModule: undefined });

      expect(getCachedDarkModeStore()).toBeUndefined();
    });

    it('should return undefined when the cached getter is not a function', () => {
      mockGetCachedModule.mockReturnValue({
        cachedModule: { [IMPORT_NAME]: 'not-a-function' },
      });

      expect(getCachedDarkModeStore()).toBeUndefined();
    });
  });

  describe('preloadDarkModeStore', () => {
    it('should preload the module', async () => {
      mockPreloadModule.mockResolvedValue(undefined);

      await preloadDarkModeStore();

      expect(mockPreloadModule).toHaveBeenCalledWith(SCOPE, MODULE);
    });
  });

  describe('useDarkModeStoreRef', () => {
    it('should return the store once useModule resolves the getter', () => {
      mockUseModule.mockReturnValue(mockGetDarkModeStore as any);
      const { result } = renderHook(() => useDarkModeStoreRef());
      expect(result.current).toBe(mockStore);
    });

    it('should return undefined until the getter resolves', () => {
      mockUseModule.mockReturnValue(undefined as any);
      const { result } = renderHook(() => useDarkModeStoreRef());
      expect(result.current).toBeUndefined();
    });
  });

  describe('useDarkModeIsDark', () => {
    it('should fall back to DOM class when no store is available', () => {
      mockUseModule.mockReturnValue(undefined as any);
      document.documentElement.classList.add('pf-v6-theme-dark');

      const { result } = renderHook(() => useDarkModeIsDark());
      expect(result.current).toBe(true);

      document.documentElement.classList.remove('pf-v6-theme-dark');
    });

    it('should return false when no store and no DOM dark class', () => {
      mockUseModule.mockReturnValue(undefined as any);
      document.documentElement.classList.remove('pf-v6-theme-dark');

      const { result } = renderHook(() => useDarkModeIsDark());
      expect(result.current).toBe(false);
    });

    it('should adopt the store value once the federated getter becomes available', () => {
      // Start without store — DOM fallback (light)
      mockUseModule.mockReturnValue(undefined as any);
      document.documentElement.classList.remove('pf-v6-theme-dark');

      const { result, rerender } = renderHook(() => useDarkModeIsDark());
      expect(result.current).toBe(false);

      // Federated store becomes available with isDark: true
      mockStore.getState.mockReturnValue({ isDark: true });
      mockStore.subscribeAll.mockReturnValue(jest.fn());
      mockUseModule.mockReturnValue(mockGetDarkModeStore as any);

      rerender();
      expect(result.current).toBe(true);
    });

    it('should subscribe to store updates and reflect later changes', () => {
      let subscriber: (() => void) | undefined;
      mockStore.getState.mockReturnValue({ isDark: false });
      mockStore.subscribeAll.mockImplementation((cb: () => void) => {
        subscriber = cb;
        return jest.fn();
      });
      mockUseModule.mockReturnValue(mockGetDarkModeStore as any);

      const { result } = renderHook(() => useDarkModeIsDark());
      expect(result.current).toBe(false);
      expect(subscriber).toBeDefined();

      // Simulate store update — dark mode toggled on
      mockStore.getState.mockReturnValue({ isDark: true });
      act(() => {
        subscriber!();
      });
      expect(result.current).toBe(true);

      // Simulate another update — dark mode toggled off
      mockStore.getState.mockReturnValue({ isDark: false });
      act(() => {
        subscriber!();
      });
      expect(result.current).toBe(false);
    });
  });
});
