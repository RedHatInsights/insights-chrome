import { renderHook } from '@testing-library/react';

jest.mock('@scalprum/core', () => ({
  getModule: jest.fn(),
  getCachedModule: jest.fn(() => ({ cachedModule: undefined })),
  preloadModule: jest.fn(() => Promise.resolve()),
}));

jest.mock('@scalprum/react-core', () => ({
  useModule: jest.fn(),
}));

import { getCachedModule, getModule, preloadModule } from '@scalprum/core';
import { useModule } from '@scalprum/react-core';
import {
  _resetBreadcrumbStoreBridge,
  getCachedBreadcrumbStore,
  loadBreadcrumbStore,
  preloadBreadcrumbStore,
  useBreadcrumbStoreRef,
} from './breadcrumbStoreBridge';

const mockGetModule = jest.mocked(getModule);
const mockGetCachedModule = jest.mocked(getCachedModule);
const mockPreloadModule = jest.mocked(preloadModule);
const mockUseModule = jest.mocked(useModule);

// Minimal stand-in for the shared store instance.
const fakeStore = { getState: jest.fn(), updateState: jest.fn(), subscribe: jest.fn(), subscribeAll: jest.fn() } as any;
const getStore = jest.fn(() => fakeStore);

describe('breadcrumbStoreBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetBreadcrumbStoreBridge();
    mockGetCachedModule.mockReturnValue({ cachedModule: undefined } as any);
  });

  describe('loadBreadcrumbStore', () => {
    it('should resolve the store through the chrome remote', async () => {
      mockGetModule.mockResolvedValue(getStore as any);

      const store = await loadBreadcrumbStore();

      expect(mockGetModule).toHaveBeenCalledWith('chrome', './breadcrumbs/store', 'getBreadcrumbStore');
      expect(store).toBe(fakeStore);
    });

    it('should memoize — getModule called once across multiple loads', async () => {
      mockGetModule.mockResolvedValue(getStore as any);

      await loadBreadcrumbStore();
      await loadBreadcrumbStore();

      expect(mockGetModule).toHaveBeenCalledTimes(1);
    });

    it('should clear the memo on failure so a later call retries', async () => {
      mockGetModule.mockRejectedValueOnce(new Error('boom'));

      await expect(loadBreadcrumbStore()).rejects.toThrow('boom');

      mockGetModule.mockResolvedValue(getStore as any);
      const store = await loadBreadcrumbStore();

      expect(store).toBe(fakeStore);
      expect(mockGetModule).toHaveBeenCalledTimes(2);
    });

    it('should retry after _resetBreadcrumbStoreBridge', async () => {
      mockGetModule.mockResolvedValue(getStore as any);

      await loadBreadcrumbStore();
      _resetBreadcrumbStoreBridge();
      await loadBreadcrumbStore();

      expect(mockGetModule).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCachedBreadcrumbStore', () => {
    it('should return the store when the module is cached', () => {
      mockGetCachedModule.mockReturnValue({ cachedModule: { getBreadcrumbStore: getStore } } as any);
      expect(getCachedBreadcrumbStore()).toBe(fakeStore);
    });

    it('should return undefined when not cached', () => {
      mockGetCachedModule.mockReturnValue({ cachedModule: undefined } as any);
      expect(getCachedBreadcrumbStore()).toBeUndefined();
    });
  });

  describe('preloadBreadcrumbStore', () => {
    it('should preload the chrome remote module', async () => {
      await preloadBreadcrumbStore();
      expect(mockPreloadModule).toHaveBeenCalledWith('chrome', './breadcrumbs/store');
    });
  });

  describe('useBreadcrumbStoreRef', () => {
    it('should return the store once useModule resolves the getter', () => {
      mockUseModule.mockReturnValue(getStore as any);
      const { result } = renderHook(() => useBreadcrumbStoreRef());
      expect(result.current).toBe(fakeStore);
    });

    it('should return undefined until the getter resolves', () => {
      mockUseModule.mockReturnValue(undefined as any);
      const { result } = renderHook(() => useBreadcrumbStoreRef());
      expect(result.current).toBeUndefined();
    });
  });
});
