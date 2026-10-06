import { AxiosResponse } from 'axios';
import { cacheFetch } from '../utils/cacheFetch';
import { DEGRADED_HEADERS, failureA, healthyPaid, healthyUnsubscribed, orgIdUserProfile } from './entitlementsContract.fixture';
import { ENTITLEMENTS_CACHE_TTL_MS, ENTITLEMENTS_TIMEOUT_MS, getEntitlementsCacheKey } from './entitlementsConstants';
import {
  EntitlementsClient,
  FetchEntitlementsOptions,
  FetchEntitlementsResult,
  clearEntitlementsCache,
  fetchEntitlements as fetchEntitlementsRequest,
} from './fetchEntitlements';
import { EntitlementsMap, getMinimumViableEntitlements, isEntitlementsMap } from './getMinimumViableEntitlements';

jest.mock('../utils/cacheFetch', () => ({
  cacheFetch: jest.fn(),
  deleteCacheKey: jest.fn().mockResolvedValue(undefined),
}));

const mockedCacheFetch = jest.mocked(cacheFetch);
const { deleteCacheKey: mockedDeleteCacheKey } = jest.requireMock('../utils/cacheFetch') as { deleteCacheKey: jest.Mock };

function userWith(profile: Record<string, unknown> = orgIdUserProfile) {
  return { profile };
}

function fetchEntitlements(user: ReturnType<typeof userWith>, options: FetchEntitlementsOptions = {}) {
  return fetchEntitlementsRequest(user, { ...options, enabled: true });
}

function axiosResponse(data: EntitlementsMap, headers: Record<string, string> = {}): AxiosResponse<EntitlementsMap> {
  return { data, headers, status: 200, statusText: 'OK', config: {} as AxiosResponse['config'] };
}

function liveCacheFetch() {
  mockedCacheFetch.mockImplementation(async (_key, fetcher) => {
    const data = await fetcher();
    return { data, fromCache: false };
  });
}

function clientWith(
  ...responses: Array<AxiosResponse<EntitlementsMap> | { response: { status: number } } | { code: string; name?: string }>
): EntitlementsClient {
  const servicesGet = jest.fn();
  for (const response of responses) {
    if (typeof response === 'object' && response !== null && 'data' in response) {
      servicesGet.mockResolvedValueOnce(response);
    } else {
      servicesGet.mockRejectedValueOnce(response);
    }
  }
  return { servicesGet };
}

async function collectUnhandled<T>(work: () => Promise<T>): Promise<{ result: T; rejections: unknown[] }> {
  const rejections: unknown[] = [];
  const onReject = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on('unhandledRejection', onReject);
  try {
    const result = await work();
    await Promise.resolve();
    await Promise.resolve();
    return { result, rejections };
  } finally {
    process.off('unhandledRejection', onReject);
  }
}

describe('fetchEntitlements', () => {
  beforeEach(() => {
    mockedCacheFetch.mockReset();
    mockedDeleteCacheKey.mockClear();
  });

  it('does not call the API when org_id is missing', async () => {
    const client = { servicesGet: jest.fn() };
    const result = await fetchEntitlements(userWith({}), { client });
    expect(client.servicesGet).not.toHaveBeenCalled();
    expect(result).toEqual({ entitlements: {}, degraded: false, source: 'empty' });
    expect(mockedCacheFetch).not.toHaveBeenCalled();
  });

  it('uses a healthy 200 body, persists, and is not degraded', async () => {
    liveCacheFetch();
    const client = clientWith(axiosResponse(healthyPaid));
    const result = await fetchEntitlements(userWith(), { client });
    expect(result).toEqual({ entitlements: healthyPaid, degraded: false, source: 'live' });
    expect(mockedCacheFetch).toHaveBeenCalledWith(
      getEntitlementsCacheKey(orgIdUserProfile.org_id),
      expect.any(Function),
      ENTITLEMENTS_CACHE_TTL_MS,
      isEntitlementsMap,
      expect.objectContaining({ enabled: true, fallbackOnAbort: true, shouldPersist: expect.any(Function) })
    );
  });

  it('treats X-Entitlements-Degraded on 200 as degraded and still uses the body', async () => {
    liveCacheFetch();
    const client = clientWith(axiosResponse(failureA, DEGRADED_HEADERS));
    const result = await fetchEntitlements(userWith(), { client });
    expect(result).toEqual({ entitlements: failureA, degraded: true, source: 'live' });
  });

  it('does not treat a healthy all-SKU-false org as degraded', async () => {
    liveCacheFetch();
    const client = clientWith(axiosResponse(healthyUnsubscribed));
    const result = await fetchEntitlements(userWith(), { client });
    expect(result.degraded).toBe(false);
    expect(result.source).toBe('live');
  });

  it('does not persist a degraded all-false body over a richer cache', async () => {
    let persistDecision: boolean | undefined;
    mockedCacheFetch.mockImplementation(async (_key, fetcher, _ttl, _guard, options) => {
      const data = await fetcher();
      persistDecision = options?.shouldPersist?.(data, healthyPaid) ?? undefined;
      return { data, fromCache: false };
    });
    const client = clientWith(axiosResponse(failureA, DEGRADED_HEADERS));
    await fetchEntitlements(userWith(), { client });
    expect(persistDecision).toBe(false);
  });

  it('persists a degraded body when there is no prior cache', async () => {
    let persistDecision: boolean | undefined;
    mockedCacheFetch.mockImplementation(async (_key, fetcher, _ttl, _guard, options) => {
      const data = await fetcher();
      persistDecision = options?.shouldPersist?.(data, null) ?? undefined;
      return { data, fromCache: false };
    });
    const client = clientWith(axiosResponse(failureA, DEGRADED_HEADERS));
    await fetchEntitlements(userWith(), { client });
    expect(persistDecision).toBe(true);
  });

  it('uses last-known-good cache on 503', async () => {
    mockedCacheFetch.mockImplementation(async (_key, fetcher) => {
      await fetcher().catch(() => undefined);
      return { data: healthyPaid, fromCache: true };
    });
    const client = clientWith({ response: { status: 503 } });
    const result = await fetchEntitlements(userWith(), { client });
    expect(result).toEqual({ entitlements: healthyPaid, degraded: true, source: 'cache' });
  });

  it('uses Option B on 503 with no cache and org_id', async () => {
    mockedCacheFetch.mockImplementation(async (_key, fetcher) => {
      await fetcher();
      throw new Error('unreachable');
    });
    const client = clientWith({ response: { status: 503 } });
    const { result, rejections } = await collectUnhandled(() => fetchEntitlements(userWith(), { client }));
    expect(rejections).toEqual([]);
    expect(result.source).toBe('defaults');
    expect(result.degraded).toBe(true);
    expect(result.entitlements).toEqual(getMinimumViableEntitlements({ profile: orgIdUserProfile }));
    expect(result.entitlements.insights.is_entitled).toBe(true);
    expect(result.entitlements.ansible).toEqual({ is_entitled: false, is_trial: false });
  });

  it.each([500, 502, 503])('falls back to Option B on HTTP %s when cacheFetch rethrows', async (status) => {
    mockedCacheFetch.mockRejectedValue({ response: { status } });
    const result = await fetchEntitlements(userWith(), { client: { servicesGet: jest.fn() } });
    expect(result.source).toBe('defaults');
    expect(result.degraded).toBe(true);
  });

  it('retries a 5xx once and uses the successful body', async () => {
    liveCacheFetch();
    const client = clientWith({ response: { status: 503 } }, axiosResponse(healthyPaid));
    const result = await fetchEntitlements(userWith(), { client });
    expect(client.servicesGet).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ entitlements: healthyPaid, degraded: false, source: 'live' });
  });

  it('does not retry 4xx and does not throw', async () => {
    mockedCacheFetch.mockImplementation(async (_key, fetcher) => {
      await fetcher();
      throw new Error('unreachable');
    });
    const client = clientWith({ response: { status: 401 } });
    const { result, rejections } = await collectUnhandled(() => fetchEntitlements(userWith(), { client }));
    expect(client.servicesGet).toHaveBeenCalledTimes(1);
    expect(rejections).toEqual([]);
    expect(result.source).toBe('defaults');
  });

  it('keeps the previous in-memory map on 503', async () => {
    mockedCacheFetch.mockRejectedValue({ response: { status: 503 } });
    const result = await fetchEntitlements(userWith(), { client: { servicesGet: jest.fn() }, previous: healthyPaid });
    expect(result).toEqual({ entitlements: healthyPaid, degraded: true, source: 'memory' });
  });

  it('does not treat {} as a previous map', async () => {
    mockedCacheFetch.mockRejectedValue({ response: { status: 503 } });
    const result = await fetchEntitlements(userWith(), { client: { servicesGet: jest.fn() }, previous: {} });
    expect(result.source).toBe('defaults');
  });

  it('times out a hung request and resolves to Option B', async () => {
    jest.useFakeTimers();
    liveCacheFetch();
    const client: EntitlementsClient = {
      servicesGet: jest.fn((_params) => {
        return new Promise((_resolve, reject) => {
          _params.options?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('canceled'), { code: 'ERR_CANCELED', name: 'CanceledError' }));
          });
        });
      }),
    };
    const pending = fetchEntitlements(userWith(), { client });
    await Promise.resolve();
    jest.advanceTimersByTime(ENTITLEMENTS_TIMEOUT_MS);
    const { result, rejections } = await collectUnhandled(() => pending);
    expect(rejections).toEqual([]);
    expect(result.source).toBe('defaults');
    expect(result.degraded).toBe(true);
    jest.useRealTimers();
  });

  it('uses cache when abort happens and cacheFetch returns last-known-good', async () => {
    mockedCacheFetch.mockResolvedValue({ data: healthyPaid, fromCache: true });
    const { result, rejections } = await collectUnhandled(() =>
      fetchEntitlements(userWith(), { client: { servicesGet: jest.fn().mockRejectedValue({ code: 'ERR_CANCELED', name: 'CanceledError' }) } })
    );
    expect(rejections).toEqual([]);
    expect(result).toEqual({ entitlements: healthyPaid, degraded: true, source: 'cache' });
  });

  it('does not throw after retry exhaustion', async () => {
    liveCacheFetch();
    const client = clientWith({ response: { status: 503 } }, { response: { status: 503 } });
    const { result, rejections } = await collectUnhandled(() => fetchEntitlements(userWith(), { client }));
    expect(client.servicesGet).toHaveBeenCalledTimes(2);
    expect(rejections).toEqual([]);
    expect(result.source).toBe('defaults');
  });

  it('returns Option B when cacheFetch rejects', async () => {
    mockedCacheFetch.mockRejectedValue({ response: { status: 503 } });
    const result = await fetchEntitlements(userWith(), { client: { servicesGet: jest.fn() } });
    expect(result.source).toBe('defaults');
    expect(mockedCacheFetch).toHaveBeenCalled();
  });
});

describe('clearEntitlementsCache', () => {
  it('deletes the entitlements cache key', async () => {
    await clearEntitlementsCache(orgIdUserProfile.org_id);
    expect(mockedDeleteCacheKey).toHaveBeenCalledWith(getEntitlementsCacheKey(orgIdUserProfile.org_id));
  });

  it('does not delete a shared key when the org is unavailable', async () => {
    mockedDeleteCacheKey.mockClear();
    await clearEntitlementsCache(undefined);
    expect(mockedDeleteCacheKey).not.toHaveBeenCalled();
  });
});

describe('fetchEntitlements with the feature disabled', () => {
  beforeEach(() => mockedCacheFetch.mockClear());

  it('uses the original request options and ignores degraded headers and previous data', async () => {
    const client = clientWith(axiosResponse(healthyUnsubscribed, DEGRADED_HEADERS));
    const result = await fetchEntitlementsRequest(userWith(), { client, previous: healthyPaid });
    expect(client.servicesGet).toHaveBeenCalledWith({});
    expect(result).toEqual({ entitlements: healthyUnsubscribed, degraded: false, source: 'live' });
    expect(mockedCacheFetch).not.toHaveBeenCalled();
  });

  it.each([401, 503])('returns the original empty map on HTTP %s without retry or storage', async (status) => {
    const client = clientWith({ response: { status } });
    const result = await fetchEntitlementsRequest(userWith(), { enabled: false, client, previous: healthyPaid });
    expect(result).toEqual({ entitlements: {}, degraded: false, source: 'empty' });
    expect(client.servicesGet).toHaveBeenCalledTimes(1);
    expect(mockedCacheFetch).not.toHaveBeenCalled();
  });

  it('does not impose a new timeout on a hung legacy request', async () => {
    jest.useFakeTimers();
    try {
      let resolve!: (value: { data: EntitlementsMap }) => void;
      const client = {
        servicesGet: jest.fn(
          () =>
            new Promise<{ data: EntitlementsMap }>((done) => {
              resolve = done;
            })
        ),
      };
      const settled = jest.fn();
      const pending = fetchEntitlementsRequest(userWith(), { client }).then(settled);
      await jest.advanceTimersByTimeAsync(ENTITLEMENTS_TIMEOUT_MS * 2);
      expect(settled).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
      resolve({ data: healthyPaid });
      await pending;
      expect(settled).toHaveBeenCalledWith({ entitlements: healthyPaid, degraded: false, source: 'live' });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('fetchEntitlements result typing', () => {
  it('keeps FetchEntitlementsResult usable as a value', () => {
    const sample: FetchEntitlementsResult = { entitlements: {}, degraded: false, source: 'empty' };
    expect(sample.source).toBe('empty');
  });
});
