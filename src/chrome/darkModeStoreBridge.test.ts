import { getCachedModule, getModule, preloadModule } from '@scalprum/core';
import { _resetDarkModeStoreBridge, getCachedDarkModeStore, loadDarkModeStore, preloadDarkModeStore } from './darkModeStoreBridge';

jest.mock('@scalprum/core', () => ({
  getCachedModule: jest.fn(),
  getModule: jest.fn(),
  preloadModule: jest.fn(),
}));

jest.mock('@scalprum/react-core', () => ({
  useModule: jest.fn(),
}));

const mockGetModule = getModule as jest.Mock;
const mockGetCachedModule = getCachedModule as jest.Mock;
const mockPreloadModule = preloadModule as jest.Mock;

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
});
