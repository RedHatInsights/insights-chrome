import { AxiosRequestConfig, AxiosResponse } from 'axios';
import entitlementsApi from './entitlementsApi';
import { ENTITLEMENTS_CACHE_KEY, ENTITLEMENTS_CACHE_TTL_MS, ENTITLEMENTS_TIMEOUT_MS } from './entitlementsConstants';
import {
  EntitlementsMap,
  EntitlementsUserProfile,
  getMinimumViableEntitlements,
  isEntitlementsMap,
  isNonEmptyEntitlementsMap,
  shouldPersistEntitlements,
} from './getMinimumViableEntitlements';
import { cacheFetch, deleteCacheKey } from '../utils/cacheFetch';

export type { EntitlementsMap };
export { getMinimumViableEntitlements } from './getMinimumViableEntitlements';
export { ENTITLEMENTS_CACHE_KEY, ENTITLEMENTS_CACHE_TTL_MS, ENTITLEMENTS_TIMEOUT_MS } from './entitlementsConstants';

export type FetchEntitlementsSource = 'live' | 'memory' | 'cache' | 'defaults' | 'empty';

export type FetchEntitlementsResult = {
  entitlements: EntitlementsMap;
  degraded: boolean;
  source: FetchEntitlementsSource;
};

export type EntitlementsClient = {
  servicesGet: (params: { options?: AxiosRequestConfig }) => Promise<{ data: unknown; headers?: AxiosResponse['headers'] }>;
};

export type FetchEntitlementsOptions = {
  previous?: EntitlementsMap;
  client?: EntitlementsClient;
  signal?: AbortSignal;
};

const defaultClient: EntitlementsClient = entitlementsApi() as EntitlementsClient;

function isAbortError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }
  const error = err as { code?: unknown; name?: unknown };
  return error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.name === 'CanceledError';
}

function getHttpStatus(err: unknown): number | undefined {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    return (err as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function is5xx(err: unknown): boolean {
  const status = getHttpStatus(err);
  return typeof status === 'number' && status >= 500 && status < 600;
}

function isEntitlementsDegraded(headers: { get?: (key: string) => unknown } | Record<string, unknown> | undefined): boolean {
  if (!headers || typeof headers !== 'object') {
    return false;
  }
  const rec = headers as Record<string, unknown> & { get?: (key: string) => unknown };
  const raw = typeof rec.get === 'function' ? rec.get('x-entitlements-degraded') : (rec['x-entitlements-degraded'] ?? rec['X-Entitlements-Degraded']);
  return String(raw).toLowerCase() === 'true';
}

function fallbackResult(user: { profile?: EntitlementsUserProfile }, previous?: EntitlementsMap): FetchEntitlementsResult {
  if (isNonEmptyEntitlementsMap(previous)) {
    return { entitlements: previous, degraded: true, source: 'memory' };
  }
  if (user.profile?.org_id) {
    return { entitlements: getMinimumViableEntitlements(user), degraded: true, source: 'defaults' };
  }
  return { entitlements: {}, degraded: false, source: 'empty' };
}

async function requestServices(client: EntitlementsClient, controller: AbortController): Promise<{ entitlements: EntitlementsMap; degraded: boolean }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (controller.signal.aborted) {
      throw lastError ?? Object.assign(new Error('Entitlements request aborted'), { code: 'ERR_CANCELED', name: 'CanceledError' });
    }
    try {
      const response = await client.servicesGet({
        options: {
          timeout: ENTITLEMENTS_TIMEOUT_MS,
          signal: controller.signal,
        },
      });
      const entitlements = response.data;
      if (!isEntitlementsMap(entitlements)) {
        throw Object.assign(new Error('invalid entitlements payload'), { response: { status: 502 } });
      }
      return { entitlements, degraded: isEntitlementsDegraded(response.headers) };
    } catch (err) {
      lastError = err;
      if (isAbortError(err) || !is5xx(err) || attempt === 1 || controller.signal.aborted) {
        throw err;
      }
    }
  }
  throw lastError;
}

export async function fetchEntitlements(user: { profile?: EntitlementsUserProfile }, options: FetchEntitlementsOptions = {}): Promise<FetchEntitlementsResult> {
  if (!user.profile?.org_id) {
    console.log('Cannot call entitlements API, no account number');
    return { entitlements: {}, degraded: false, source: 'empty' };
  }

  const client = options.client ?? defaultClient;
  const controller = new AbortController();
  const onOuterAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', onOuterAbort, { once: true });
    }
  }
  const timer = setTimeout(() => controller.abort(), ENTITLEMENTS_TIMEOUT_MS);

  let liveDegraded = false;

  try {
    const { data, fromCache } = await cacheFetch(
      ENTITLEMENTS_CACHE_KEY,
      async () => {
        const live = await requestServices(client, controller);
        liveDegraded = live.degraded;
        return live.entitlements;
      },
      ENTITLEMENTS_CACHE_TTL_MS,
      isEntitlementsMap,
      {
        enabled: true,
        fallbackOnAbort: true,
        shouldPersist: (live, cached) => shouldPersistEntitlements(live, cached, liveDegraded),
      }
    );

    if (fromCache) {
      return { entitlements: data, degraded: true, source: 'cache' };
    }
    return { entitlements: data, degraded: liveDegraded, source: 'live' };
  } catch {
    return fallbackResult(user, options.previous);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onOuterAbort);
  }
}

export async function clearEntitlementsCache(): Promise<void> {
  await deleteCacheKey(ENTITLEMENTS_CACHE_KEY);
}
