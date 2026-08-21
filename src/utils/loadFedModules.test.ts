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
    it('falls back to CSC when primary returns malformed data', async () => {
      const malformedData = { app1: { cdnPath: '/apps/app1/' } }; // missing manifestLocation
      const validCscData = { app1: { manifestLocation: '/apps/app1/fed-mods.json' } };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: malformedData }),
        csc: () => Promise.resolve({ data: validCscData }),
      });

      const result = await loadFedModules();
      expect(result.data).toEqual(validCscData);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Chrome Service fed-modules response is not a valid module map');
    });

    it('falls back to IndexedDB when primary and CSC both return malformed data', async () => {
      const malformedPrimary = { app1: { cdnPath: '/apps/app1/' } };
      const malformedCsc = { app1: 'not-an-object' };
      const cachedData = { app1: { manifestLocation: '/apps/app1/fed-mods.json' } };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: malformedPrimary }),
        csc: () => Promise.resolve({ data: malformedCsc }),
      });
      mockGetItem.mockResolvedValue({ data: cachedData, cachedAt: Date.now() });

      const result = await loadFedModules();
      expect(result.data).toEqual(cachedData);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Chrome Service fed-modules response is not a valid module map');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Fed modules loaded from IndexedDB cache (origin unavailable)');
    });

    it('throws when primary, CSC both return malformed data and no cache exists', async () => {
      const malformedData = { app1: { cdnPath: '/apps/app1/' } };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: malformedData }),
        csc: () => Promise.resolve({ data: malformedData }),
      });
      mockGetItem.mockResolvedValue(null);

      await expect(loadFedModules()).rejects.toThrow('not a valid module map');
    });

    it('falls back to CSC when primary returns an array', async () => {
      const validCscData = { app1: { manifestLocation: '/apps/app1/fed-mods.json' } };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: [{ manifestLocation: '/bad' }] }),
        csc: () => Promise.resolve({ data: validCscData }),
      });

      const result = await loadFedModules();
      expect(result.data).toEqual(validCscData);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Chrome Service fed-modules response is not a valid module map');
    });

    it('falls back to CSC when primary returns null body', async () => {
      const validCscData = { app1: { manifestLocation: '/apps/app1/fed-mods.json' } };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: null }),
        csc: () => Promise.resolve({ data: validCscData }),
      });

      const result = await loadFedModules();
      expect(result.data).toEqual(validCscData);
    });

    it('throws when CSC returns an array and no cache exists', async () => {
      mockAxiosByUrl({
        primary: () => Promise.reject(new Error('primary 503')),
        csc: () => Promise.resolve({ data: [{ manifestLocation: '/bad' }] }),
      });
      mockGetItem.mockResolvedValue(null);

      await expect(loadFedModules()).rejects.toThrow('not a valid module map');
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

    it('falls back to CSC when primary has non-object entry', async () => {
      const invalidData = {
        app1: { manifestLocation: '/apps/app1/fed-mods.json' },
        app2: 'not-an-object', // invalid
      };
      const validCscData = { app1: { manifestLocation: '/apps/app1/fed-mods.json' } };
      mockAxiosByUrl({
        primary: () => Promise.resolve({ data: invalidData }),
        csc: () => Promise.resolve({ data: validCscData }),
      });

      const result = await loadFedModules();
      expect(result.data).toEqual(validCscData);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[chrome] Chrome Service fed-modules response is not a valid module map');
    });
  });
});
