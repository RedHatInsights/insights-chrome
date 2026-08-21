import axios from 'axios';
import localforage from 'localforage';
import fetchNavigationFiles from './fetchNavigationFiles';
import { CACHE_SCHEMA_VERSION } from './cacheFetch';
import { BundleNavigation } from '../@types/types';

const mockSetItem = jest.fn();
const mockGetItem = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('localforage', () => ({
  INDEXEDDB: 'asyncStorage',
  WEBSQL: 'webSQLStorage',
  LOCALSTORAGE: 'localStorageWrapper',
  createInstance: jest.fn(),
}));

jest.mock('./common', () => ({
  ITLess: jest.fn(() => false),
  getChromeStaticPathname: jest.fn(() => '/api/static'),
}));

jest.mock('../components/AppFilter/useAppFilter', () => ({
  itLessBundles: [],
  requiredBundles: ['insights', 'settings'],
}));

const cacheKey = `v${CACHE_SCHEMA_VERSION}:bundles-generated`;

describe('fetchNavigationFiles', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSetItem.mockReset().mockResolvedValue(undefined);
    mockGetItem.mockReset().mockResolvedValue(null);
    jest
      .mocked(localforage.createInstance)
      .mockClear()
      .mockReturnValue({
        setItem: mockSetItem,
        getItem: mockGetItem,
      } as unknown as LocalForage);
    jest.mocked(axios.get).mockReset();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('feoGenerated mode', () => {
    it('fetches bundles-generated.json, normalizes data, and caches it', async () => {
      const rawData = [
        {
          id: 'insights',
          title: 'Insights',
          routes: [{ href: '/insights/dashboard', title: 'Dashboard' }],
        },
      ];

      jest.mocked(axios.get).mockResolvedValue({ data: rawData });

      const result = await fetchNavigationFiles(true);

      expect(axios.get).toHaveBeenCalledWith('/api/chrome-service/v1/static/bundles-generated.json');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'insights',
        title: 'Insights',
        navItems: [{ href: '/insights/dashboard', title: 'Dashboard' }],
      });
      expect(mockSetItem).toHaveBeenCalledWith(cacheKey, expect.objectContaining({ data: rawData }));
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('normalizes routes to navItems recursively', async () => {
      const rawData = [
        {
          id: 'settings',
          title: 'Settings',
          routes: [
            {
              title: 'User Preferences',
              routes: [{ href: '/settings/profile', title: 'Profile' }],
            },
          ],
        },
      ];

      jest.mocked(axios.get).mockResolvedValue({ data: rawData });

      const result = await fetchNavigationFiles(true);

      expect(result[0].navItems?.[0]).toMatchObject({
        title: 'User Preferences',
        navItems: [{ href: '/settings/profile', title: 'Profile' }],
      });
    });

    it('drops malformed live entries and keeps the valid ones without falling back to cache', async () => {
      const rawData = [
        { id: 'valid', title: 'Valid Bundle', routes: [] },
        undefined,
        { id: 'another', title: 'Another', routes: [] },
      ] as unknown as BundleNavigation[];

      const cachedData: BundleNavigation[] = [
        {
          id: 'cached-bundle',
          title: 'Cached',
          navItems: [{ href: '/cached', title: 'Cached Page' }],
        },
      ];

      jest.mocked(axios.get).mockResolvedValue({ data: rawData });
      mockGetItem.mockResolvedValue({ data: cachedData, cachedAt: Date.now() });

      const result = await fetchNavigationFiles(true);

      // One bad entry must not nuke all navigation: bad entries are filtered,
      // valid live entries are returned, and the cache is NOT used.
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(['valid', 'another']);
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('IndexedDB cache'));
    });

    it('falls back to IndexedDB cache when network fails and logs warning', async () => {
      const cachedData: BundleNavigation[] = [
        {
          id: 'cached-bundle',
          title: 'Cached',
          navItems: [{ href: '/cached', title: 'Cached Page' }],
        },
      ];

      jest.mocked(axios.get).mockRejectedValue(new Error('Network error'));
      mockGetItem.mockResolvedValue({ data: cachedData, cachedAt: Date.now() });

      const result = await fetchNavigationFiles(true);

      expect(mockGetItem).toHaveBeenCalledWith(cacheKey);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cached-bundle');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Bundle navigation loaded from IndexedDB cache (origin unavailable)');
    });

    it('normalizes cached data with routes field', async () => {
      const cachedData = [
        {
          id: 'legacy',
          title: 'Legacy',
          routes: [{ href: '/legacy', title: 'Old Format' }],
        },
      ];

      jest.mocked(axios.get).mockRejectedValue(new Error('Network error'));
      mockGetItem.mockResolvedValue({ data: cachedData, cachedAt: Date.now() });

      const result = await fetchNavigationFiles(true);

      expect(result[0].navItems).toEqual([{ href: '/legacy', title: 'Old Format' }]);
    });

    it('throws when network fails and no cache exists', async () => {
      jest.mocked(axios.get).mockRejectedValue(new Error('Network error'));
      mockGetItem.mockResolvedValue(null);

      await expect(fetchNavigationFiles(true)).rejects.toThrow('Network error');
    });

    it('rejects non-array response and does not cache it, falls back to cache if available', async () => {
      const cachedData: BundleNavigation[] = [
        {
          id: 'cached-bundle',
          title: 'Cached',
          navItems: [{ href: '/cached', title: 'Cached Page' }],
        },
      ];

      // Return non-array payload (malformed response)
      jest.mocked(axios.get).mockResolvedValue({ data: { error: 'malformed' } as unknown as BundleNavigation[] });
      mockGetItem.mockResolvedValue({ data: cachedData, cachedAt: Date.now() });

      const result = await fetchNavigationFiles(true);

      // Should fall back to cache when live response is malformed
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cached-bundle');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Bundle navigation loaded from IndexedDB cache (origin unavailable)');
    });

    it('rejects malformed bundle entries with conflicting navItems and routes fields', async () => {
      const rawData = [
        { id: 'valid', title: 'Valid Bundle', routes: [] },
        {
          id: 'conflicting',
          title: 'Conflicting',
          navItems: 'not-an-array' as unknown as never[],
          routes: [],
        },
        { id: 'another', title: 'Another', navItems: [] },
      ] as BundleNavigation[];

      jest.mocked(axios.get).mockResolvedValue({ data: rawData });

      const result = await fetchNavigationFiles(true);

      // The malformed entry with non-array navItems should be filtered out
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(['valid', 'another']);
    });

    it('rejects bundle entries where routes field is not an array', async () => {
      const rawData = [
        { id: 'valid', title: 'Valid Bundle', routes: [] },
        {
          id: 'malformed',
          title: 'Malformed',
          routes: 'not-an-array' as unknown as never[],
        },
      ] as BundleNavigation[];

      jest.mocked(axios.get).mockResolvedValue({ data: rawData });

      const result = await fetchNavigationFiles(true);

      // The malformed entry with non-array routes should be filtered out
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid');
    });

    it('rejects bundle entries where both navItems and routes are present but one is not an array', async () => {
      const rawData = [
        { id: 'valid', title: 'Valid Bundle', navItems: [], routes: [] },
        {
          id: 'malformed',
          title: 'Malformed',
          navItems: [],
          routes: 'not-an-array' as unknown as never[],
        },
      ] as BundleNavigation[];

      jest.mocked(axios.get).mockResolvedValue({ data: rawData });

      const result = await fetchNavigationFiles(true);

      // The malformed entry should be filtered out
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid');
    });
  });

  describe('legacy bundle mode', () => {
    it('fetches individual bundle files when feoGenerated=false', async () => {
      const insightsNav = {
        id: 'insights',
        title: 'Insights',
        navItems: [{ href: '/insights', title: 'Dashboard' }],
      };
      const settingsNav = {
        id: 'settings',
        title: 'Settings',
        navItems: [{ href: '/settings', title: 'Settings' }],
      };

      jest.mocked(axios.get).mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('insights-navigation.json')) {
          return Promise.resolve({ data: insightsNav });
        }
        if (typeof url === 'string' && url.includes('settings-navigation.json')) {
          return Promise.resolve({ data: settingsNav });
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`));
      });

      const result = await fetchNavigationFiles(false);

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(['insights', 'settings']);
    });
  });
});
