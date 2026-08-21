import localforage from 'localforage';
import { CACHE_SCHEMA_VERSION, CACHE_TTL_MS, cacheFetch } from './cacheFetch';

const mockSetItem = jest.fn();
const mockGetItem = jest.fn();

jest.mock('localforage', () => ({
  INDEXEDDB: 'asyncStorage',
  WEBSQL: 'webSQLStorage',
  LOCALSTORAGE: 'localStorageWrapper',
  createInstance: jest.fn(),
}));

describe('cacheFetch', () => {
  beforeEach(() => {
    mockSetItem.mockReset().mockResolvedValue(undefined);
    mockGetItem.mockReset().mockResolvedValue(null);
    jest
      .mocked(localforage.createInstance)
      .mockClear()
      .mockReturnValue({ setItem: mockSetItem, getItem: mockGetItem } as unknown as LocalForage);
  });

  it('returns data from fetcher and stores a versioned envelope on success', async () => {
    const fetcher = jest.fn().mockResolvedValue({ foo: 'bar' });
    const before = Date.now();
    const result = await cacheFetch('test-key', fetcher);
    const after = Date.now();

    expect(result).toEqual({ data: { foo: 'bar' }, fromCache: false });
    expect(mockSetItem).toHaveBeenCalledWith(`v${CACHE_SCHEMA_VERSION}:test-key`, expect.objectContaining({ data: { foo: 'bar' } }));
    const envelope = mockSetItem.mock.calls[0][1] as { cachedAt: number };
    expect(envelope.cachedAt).toBeGreaterThanOrEqual(before);
    expect(envelope.cachedAt).toBeLessThanOrEqual(after);
  });

  it('returns cached data with fromCache: true when fetcher fails and cache exists', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
    mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });
    const result = await cacheFetch('test-key', fetcher);
    expect(result).toEqual({ data: { foo: 'cached' }, fromCache: true });
    expect(mockGetItem).toHaveBeenCalledWith(`v${CACHE_SCHEMA_VERSION}:test-key`);
  });

  it('rethrows original error when fetcher fails and no cache exists', async () => {
    const error = new Error('network error');
    const fetcher = jest.fn().mockRejectedValue(error);
    mockGetItem.mockResolvedValue(null);
    await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
  });

  it('rethrows original error when fetcher fails and IndexedDB is unavailable', async () => {
    const error = new Error('network error');
    const fetcher = jest.fn().mockRejectedValue(error);
    mockGetItem.mockRejectedValue(new Error('IndexedDB unavailable'));
    await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
  });

  it('returns data successfully even when setItem fails', async () => {
    const fetcher = jest.fn().mockResolvedValue({ foo: 'bar' });
    mockSetItem.mockRejectedValue(new Error('storage full'));
    const result = await cacheFetch('test-key', fetcher);
    expect(result).toEqual({ data: { foo: 'bar' }, fromCache: false });
  });

  it('does not call getItem when fetcher succeeds', async () => {
    const fetcher = jest.fn().mockResolvedValue({ data: 'ok' });
    await cacheFetch('test-key', fetcher);
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it('ignores expired cache entries and rethrows', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
    mockGetItem.mockResolvedValue({
      data: { foo: 'stale' },
      cachedAt: Date.now() - CACHE_TTL_MS - 1,
    });
    await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
  });

  it('ignores legacy bare values without an envelope', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
    mockGetItem.mockResolvedValue({ foo: 'legacy' });
    await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
  });

  it('respects a custom ttlMs', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
    mockGetItem.mockResolvedValue({
      data: { foo: 'fresh-enough' },
      cachedAt: Date.now() - 1000,
    });
    const result = await cacheFetch('test-key', fetcher, 5000);
    expect(result).toEqual({ data: { foo: 'fresh-enough' }, fromCache: true });
  });

  it('does not treat a cached null payload as usable', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
    mockGetItem.mockResolvedValue({ data: null, cachedAt: Date.now() });
    await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
  });

  describe('payload guard validation', () => {
    type TestPayload = { foo: string };
    const isTestPayload = (data: unknown): data is TestPayload => {
      return typeof data === 'object' && data !== null && 'foo' in data && typeof (data as TestPayload).foo === 'string';
    };

    it('returns live fetch but does not cache it when payload guard fails', async () => {
      // The origin is authoritative: a bootstrap-critical caller (e.g. loadFedModules)
      // must still receive live data on schema drift rather than crash the app boot.
      const fetcher = jest.fn().mockResolvedValue({ bar: 'wrong shape' });
      const result = await cacheFetch('test-key', fetcher, CACHE_TTL_MS, isTestPayload);
      expect(result).toEqual({ data: { bar: 'wrong shape' }, fromCache: false });
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it('accepts live fetch when payload guard passes', async () => {
      const fetcher = jest.fn().mockResolvedValue({ foo: 'correct' });
      const result = await cacheFetch('test-key', fetcher, CACHE_TTL_MS, isTestPayload);
      expect(result).toEqual({ data: { foo: 'correct' }, fromCache: false });
      expect(mockSetItem).toHaveBeenCalledWith(`v${CACHE_SCHEMA_VERSION}:test-key`, expect.objectContaining({ data: { foo: 'correct' } }));
    });

    it('rejects cached data when payload guard fails', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
      mockGetItem.mockResolvedValue({ data: { bar: 'wrong shape' }, cachedAt: Date.now() });
      await expect(cacheFetch('test-key', fetcher, CACHE_TTL_MS, isTestPayload)).rejects.toThrow('network error');
    });

    it('accepts cached data when payload guard passes', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
      mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });
      const result = await cacheFetch('test-key', fetcher, CACHE_TTL_MS, isTestPayload);
      expect(result).toEqual({ data: { foo: 'cached' }, fromCache: true });
    });
  });

  describe('timestamp validation', () => {
    it('rejects cached data with non-finite cachedAt', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
      mockGetItem.mockResolvedValue({ data: { foo: 'bar' }, cachedAt: NaN });
      await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
    });

    it('rejects cached data with Infinity cachedAt', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
      mockGetItem.mockResolvedValue({ data: { foo: 'bar' }, cachedAt: Infinity });
      await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
    });

    it('rejects cached data with future cachedAt', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
      const futureTime = Date.now() + 10000;
      mockGetItem.mockResolvedValue({ data: { foo: 'bar' }, cachedAt: futureTime });
      await expect(cacheFetch('test-key', fetcher)).rejects.toThrow('network error');
    });

    it('accepts cached data with valid past timestamp', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('network error'));
      const pastTime = Date.now() - 1000;
      mockGetItem.mockResolvedValue({ data: { foo: 'bar' }, cachedAt: pastTime });
      const result = await cacheFetch('test-key', fetcher);
      expect(result).toEqual({ data: { foo: 'bar' }, fromCache: true });
    });
  });

  describe('cache fallback error filtering', () => {
    it('does not use cache for 4xx errors (client errors)', async () => {
      const error = { response: { status: 404 }, message: 'Not Found' };
      const fetcher = jest.fn().mockRejectedValue(error);
      mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });

      await expect(cacheFetch('test-key', fetcher)).rejects.toEqual(error);
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it('does not use cache for 401 errors (authentication)', async () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' };
      const fetcher = jest.fn().mockRejectedValue(error);
      mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });

      await expect(cacheFetch('test-key', fetcher)).rejects.toEqual(error);
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it('does not use cache for 403 errors (forbidden)', async () => {
      const error = { response: { status: 403 }, message: 'Forbidden' };
      const fetcher = jest.fn().mockRejectedValue(error);
      mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });

      await expect(cacheFetch('test-key', fetcher)).rejects.toEqual(error);
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it('uses cache for 5xx errors (server errors)', async () => {
      const error = { response: { status: 500 }, message: 'Internal Server Error' };
      const fetcher = jest.fn().mockRejectedValue(error);
      mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });

      const result = await cacheFetch('test-key', fetcher);
      expect(result).toEqual({ data: { foo: 'cached' }, fromCache: true });
      expect(mockGetItem).toHaveBeenCalledWith(`v${CACHE_SCHEMA_VERSION}:test-key`);
    });

    it('uses cache for 503 errors (service unavailable)', async () => {
      const error = { response: { status: 503 }, message: 'Service Unavailable' };
      const fetcher = jest.fn().mockRejectedValue(error);
      mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });

      const result = await cacheFetch('test-key', fetcher);
      expect(result).toEqual({ data: { foo: 'cached' }, fromCache: true });
    });

    it('uses cache for network errors (no response)', async () => {
      const error = new Error('Network Error');
      const fetcher = jest.fn().mockRejectedValue(error);
      mockGetItem.mockResolvedValue({ data: { foo: 'cached' }, cachedAt: Date.now() });

      const result = await cacheFetch('test-key', fetcher);
      expect(result).toEqual({ data: { foo: 'cached' }, fromCache: true });
    });

    it('rethrows 5xx error when no cache exists', async () => {
      const error = { response: { status: 500 }, message: 'Internal Server Error' };
      const fetcher = jest.fn().mockRejectedValue(error);
      mockGetItem.mockResolvedValue(null);

      await expect(cacheFetch('test-key', fetcher)).rejects.toEqual(error);
    });
  });
});

describe('cacheFetch stale-version cleanup', () => {
  // Runs in isolation so the module-level cache instance is created fresh and
  // triggers the one-time purge on the mocked store.
  it('removes only keys from older schema versions', async () => {
    await jest.isolateModulesAsync(async () => {
      const lf = (await import('localforage')).default;
      const removeItem = jest.fn().mockResolvedValue(undefined);
      const keys = jest.fn().mockResolvedValue([`v${CACHE_SCHEMA_VERSION}:keep`, 'v0:drop', 'unversioned:keep']);
      jest.mocked(lf.createInstance).mockReturnValue({
        setItem: jest.fn().mockResolvedValue(undefined),
        getItem: jest.fn().mockResolvedValue(null),
        keys,
        removeItem,
      } as unknown as LocalForage);

      const { cacheFetch: freshCacheFetch } = await import('./cacheFetch');
      await freshCacheFetch('keep', jest.fn().mockResolvedValue('ok'));
      // Let the fire-and-forget purge microtasks settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(removeItem).toHaveBeenCalledTimes(1);
      expect(removeItem).toHaveBeenCalledWith('v0:drop');
    });
  });
});
