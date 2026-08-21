import axios from 'axios';
import localforage from 'localforage';
import { CACHE_SCHEMA_VERSION } from './cacheFetch';
import { loadFedModules } from './common';

const mockSetItem = jest.fn();
const mockGetItem = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('axios-cache-interceptor', () => ({
  setupCache: jest.fn((axiosInstance) => axiosInstance),
}));

jest.mock('../hooks/useBundle', () => ({
  getUrl: jest.fn(),
  __esModule: true,
  default: jest.fn(() => ({ bundleTitle: 'Test' })),
}));

jest.mock('localforage', () => ({
  INDEXEDDB: 'asyncStorage',
  WEBSQL: 'webSQLStorage',
  LOCALSTORAGE: 'localStorageWrapper',
  createInstance: jest.fn(),
}));

const primaryPath = '/api/chrome-service/v1/static/fed-modules-generated.json';
const cscPathPrefix = '/config/chrome/fed-modules.json';
const feoPath = '/apps/chrome/operator-generated/fed-modules.json';
const cacheKey = `v${CACHE_SCHEMA_VERSION}:fed-modules-generated`;

describe('loadFedModules', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSetItem.mockReset().mockResolvedValue(undefined);
    mockGetItem.mockReset().mockResolvedValue(null);
    jest
      .mocked(localforage.createInstance)
      .mockClear()
      .mockReturnValue({ setItem: mockSetItem, getItem: mockGetItem } as unknown as LocalForage);
    jest.mocked(axios.get).mockReset();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  function mockAxiosByUrl(handlers: {
    primary?: () => Promise<{ data: unknown }>;
    csc?: () => Promise<{ data: unknown }>;
    feo?: () => Promise<{ data: unknown }>;
  }) {
    jest.mocked(axios.get).mockImplementation((url: string) => {
      if (url === primaryPath) {
        return handlers.primary ? handlers.primary() : Promise.reject(new Error('primary failed'));
      }
      if (typeof url === 'string' && url.includes(cscPathPrefix)) {
        return handlers.csc ? handlers.csc() : Promise.reject(new Error('csc failed'));
      }
      if (url === feoPath) {
        return handlers.feo ? handlers.feo() : Promise.resolve({ data: {} });
      }
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });
  }

  it('returns primary chrome-service data and writes IndexedDB cache', async () => {
    const primaryData = { chrome: { manifestLocation: '/apps/chrome/fed-mods.json', modules: ['primary'] } };
    mockAxiosByUrl({
      primary: () => Promise.resolve({ data: primaryData }),
    });

    const result = await loadFedModules();

    expect(result.data).toEqual(primaryData);
    expect(mockSetItem).toHaveBeenCalledWith(cacheKey, expect.objectContaining({ data: primaryData }));
    expect(jest.mocked(axios.get).mock.calls.some(([url]) => typeof url === 'string' && url.includes(cscPathPrefix))).toBe(false);
    expect(mockGetItem).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('falls back to live CSC when primary fails and caches CSC data', async () => {
    const cscData = { chrome: { manifestLocation: '/apps/chrome/fed-mods.json', modules: ['csc'] } };
    mockAxiosByUrl({
      primary: () => Promise.reject(new Error('chrome-service 503')),
      csc: () => Promise.resolve({ data: cscData }),
    });
    // Warm IndexedDB must not short-circuit CSC while the live fallback works
    mockGetItem.mockResolvedValue({
      data: { chrome: { manifestLocation: '/apps/chrome/fed-mods.json', modules: ['stale-idb'] } },
      cachedAt: Date.now(),
    });

    const result = await loadFedModules();

    expect(result.data).toEqual(cscData);
    expect(jest.mocked(axios.get).mock.calls.some(([url]) => typeof url === 'string' && url.includes(cscPathPrefix))).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith(cacheKey, expect.objectContaining({ data: cscData }));
    expect(mockGetItem).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('uses IndexedDB only when primary and CSC both fail', async () => {
    const cachedData = { chrome: { manifestLocation: '/apps/chrome/fed-mods.json', modules: ['cached'] } };
    mockAxiosByUrl({
      primary: () => Promise.reject(new Error('chrome-service 503')),
      csc: () => Promise.reject(new Error('csc 503')),
    });
    mockGetItem.mockResolvedValue({ data: cachedData, cachedAt: Date.now() });

    const result = await loadFedModules();

    expect(result.data).toEqual(cachedData);
    expect(mockGetItem).toHaveBeenCalledWith(cacheKey);
    expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Fed modules loaded from IndexedDB cache (origin unavailable)');
  });

  it('rethrows when primary, CSC, and IndexedDB all miss', async () => {
    mockAxiosByUrl({
      primary: () => Promise.reject(new Error('chrome-service 503')),
      csc: () => Promise.reject(new Error('csc 503')),
    });
    mockGetItem.mockResolvedValue(null);

    await expect(loadFedModules()).rejects.toThrow('csc 503');
  });

  it('merges FEO chrome override onto static config', async () => {
    mockAxiosByUrl({
      primary: () =>
        Promise.resolve({
          data: {
            chrome: { manifestLocation: '/apps/chrome/fed-mods.json', modules: ['primary'] },
            other: { manifestLocation: '/apps/other/fed-mods.json' },
          },
        }),
      feo: () => Promise.resolve({ data: { chrome: { modules: ['feo'] } } }),
    });

    const result = await loadFedModules();

    expect(result.data).toEqual({
      chrome: { modules: ['feo'] },
      other: { manifestLocation: '/apps/other/fed-mods.json' },
    });
  });

  describe('payload validation', () => {
    it('returns a malformed primary response but does not cache it', async () => {
      // The origin is authoritative: boot must not be blocked because the payload
      // guard does not recognize the live shape. The data is returned; only caching
      // is skipped so a bad response can never become a poisoned last-known-good.
      const malformedData = { app1: { cdnPath: '/apps/app1/' } }; // missing manifestLocation
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: malformedData }),
        csc: () => Promise.reject(new Error('csc unavailable')),
      });
      mockGetItem.mockResolvedValue(null);

      const result = await loadFedModules();
      expect(result.data).toEqual(malformedData);
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it('returns a malformed CSC fallback but does not cache it', async () => {
      const malformedData = { app1: { cdnPath: '/apps/app1/' } }; // missing manifestLocation
      mockAxiosByUrl({
        primary: () => Promise.reject(new Error('primary unavailable')),
        csc: () => Promise.resolve({ data: malformedData }),
      });
      mockGetItem.mockResolvedValue(null);

      const result = await loadFedModules();
      expect(result.data).toEqual(malformedData);
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it('rejects malformed cached data missing manifestLocation', async () => {
      const malformedCached = { app1: { cdnPath: '/apps/app1/' } }; // missing manifestLocation
      mockAxiosByUrl({
        primary: () => Promise.reject(new Error('primary unavailable')),
        csc: () => Promise.reject(new Error('csc unavailable')),
      });
      mockGetItem.mockResolvedValue({ data: malformedCached, cachedAt: Date.now() });

      await expect(loadFedModules()).rejects.toThrow('csc unavailable');
      expect(consoleWarnSpy).not.toHaveBeenCalledWith('[chrome] Fed modules loaded from IndexedDB cache (origin unavailable)');
    });

    it('accepts valid federated modules with $schema field', async () => {
      const validData = {
        $schema: '../../../modulesSchema.json',
        app1: { manifestLocation: '/apps/app1/fed-mods.json' },
      };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: validData }),
      });

      const result = await loadFedModules();
      expect(result.data).toEqual(validData);
      expect(mockSetItem).toHaveBeenCalledWith(cacheKey, expect.objectContaining({ data: validData }));
    });

    it('returns federated modules with a non-object entry but does not cache them', async () => {
      const invalidData = {
        app1: { manifestLocation: '/apps/app1/fed-mods.json' },
        app2: 'not-an-object', // invalid
      };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: invalidData }),
      });

      const result = await loadFedModules();
      expect(result.data).toEqual(invalidData);
      expect(mockSetItem).not.toHaveBeenCalled();
    });
  });
});
