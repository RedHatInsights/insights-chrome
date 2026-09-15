import localforage from 'localforage';
import { getFeatureFlagsError, getUnleashClient, unleashClientExists } from '../components/FeatureFlags/unleashClient';

export type CacheFetchResult<T> = { data: T; fromCache: boolean };
export type CacheFetchOptions = { enabled: boolean };

/** Bump when cached payload shapes change incompatibly. */
export const CACHE_SCHEMA_VERSION = 1;

export const CONFIG_CACHE_FALLBACK_FLAG = 'platform.chrome.config-cache-fallback';

/** Discard last-known-good entries older than this (7 days). */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEnvelope<T> = {
  cachedAt: number;
  data: T;
};

let cache: LocalForage | undefined;

function getCache(): LocalForage {
  if (!cache) {
    cache = localforage.createInstance({
      driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
      name: 'chrome-config-cache',
    });
    purgeStaleVersions(cache);
  }
  return cache;
}

function storageKey(key: string): string {
  return `v${CACHE_SCHEMA_VERSION}:${key}`;
}

function isValidEnvelope<T>(value: unknown, payloadGuard?: (data: unknown) => data is T): value is CacheEnvelope<T> {
  if (typeof value !== 'object' || value === null || !('data' in value) || !('cachedAt' in value)) {
    return false;
  }
  const envelope = value as CacheEnvelope<unknown>;
  const cachedAt = envelope.cachedAt;

  // Reject non-finite or future timestamps
  if (typeof cachedAt !== 'number' || !Number.isFinite(cachedAt) || cachedAt > Date.now()) {
    return false;
  }

  if (envelope.data == null) {
    return false;
  }

  // If a payload guard is provided, validate the data shape
  if (payloadGuard && !payloadGuard(envelope.data)) {
    return false;
  }

  return true;
}

/**
 * Best-effort removal of entries left behind by older schema versions.
 * Runs once per instance; failures are swallowed since this is pure housekeeping.
 */
function purgeStaleVersions(store: LocalForage): void {
  const prefix = `v${CACHE_SCHEMA_VERSION}:`;
  Promise.resolve(store.keys?.())
    .then((keys) => Promise.all((keys ?? []).filter((k) => /^v\d+:/.test(k) && !k.startsWith(prefix)).map((k) => store.removeItem(k))))
    .catch(() => undefined);
}

/**
 * Determines if an error qualifies for cache fallback.
 * Cache is used only for origin failures (5xx) and network errors.
 * Client errors (4xx) propagate immediately — stale SSO config for 401 is worse than failure.
 */
function shouldUseCacheFallback(err: unknown): boolean {
  if (typeof err === 'object' && err !== null) {
    const error = err as { code?: unknown; name?: unknown };
    if (error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.name === 'CanceledError') {
      return false;
    }
  }

  // Axios errors have a response property
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number } }).response;
    if (response?.status) {
      // Only 5xx errors (server-side failures) qualify for cache fallback
      return response.status >= 500 && response.status < 600;
    }
  }
  // Network errors (no response) qualify for fallback
  return true;
}

/**
 * Runtime cache fallback is fail-closed. The cache feature must not activate while
 * the flag client is missing, not ready, or reporting an error. This synchronous
 * check never delays the network-first fetch path; cacheFetch waits for readiness
 * only when deciding what to do after a failed live request.
 * Bootstrap callers pass { enabled: true } explicitly instead.
 */
export function isConfigCacheFallbackEnabled(): boolean {
  try {
    if (!unleashClientExists() || getFeatureFlagsError()) {
      return false;
    }

    const client = getUnleashClient();
    if (client.isReady?.() !== true || getFeatureFlagsError()) {
      return false;
    }
    return client.isEnabled(CONFIG_CACHE_FALLBACK_FLAG);
  } catch {
    return false;
  }
}

const FLAG_READY_TIMEOUT_MS = 5_000;

const waitForFlagClientReady = (client: ReturnType<typeof getUnleashClient>): Promise<boolean> => {
  if (client.isReady?.() === true) {
    return Promise.resolve(true);
  }

  if (!client.on || !client.off) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const finish = (ready: boolean) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      client.off('ready', onReady);
      client.off('error', onError);
      resolve(ready);
    };
    const onReady = () => finish(true);
    const onError = () => finish(false);

    client.on('ready', onReady);
    client.on('error', onError);
    timeout = setTimeout(() => finish(false), FLAG_READY_TIMEOUT_MS);
  });
};

const getConfigCacheFallbackPolicy = (): Promise<boolean> => {
  try {
    if (!unleashClientExists() || getFeatureFlagsError()) {
      return Promise.resolve(false);
    }

    const client = getUnleashClient();
    if (client.isReady?.() === true) {
      return Promise.resolve(isConfigCacheFallbackEnabled());
    }
    return waitForFlagClientReady(client).then((ready) => ready && isConfigCacheFallbackEnabled());
  } catch {
    return Promise.resolve(false);
  }
};

/**
 * Network-first fetch with IndexedDB fallback.
 * On success: stores `{ data, cachedAt }` under a versioned key and returns `{ data, fromCache: false }`.
 * On failure: returns last-known-good when present, unexpired, and schema-compatible as `{ data, fromCache: true }`.
 * If no usable cache exists: rethrows the original error.
 *
 * Cache fallback is limited to origin failures (5xx responses) and network errors.
 * Client errors (4xx) propagate immediately to avoid serving stale config for auth/permission failures.
 *
 * @param payloadGuard - Optional runtime validator for the payload shape. A live response that fails the guard is
 *                       still returned (the origin is authoritative) but is NOT cached. A cached read that fails the
 *                       guard is discarded so the caller falls through to rethrowing the original error.
 * @param options - Cache policy. Disabled mode calls fetcher directly and never initializes or accesses storage.
 */
export async function cacheFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CACHE_TTL_MS,
  payloadGuard?: (data: unknown) => data is T,
  options?: CacheFetchOptions
): Promise<CacheFetchResult<T>> {
  const cacheFallbackPolicy = options ? Promise.resolve(options.enabled) : getConfigCacheFallbackPolicy();
  const liveFetch = Promise.resolve().then(fetcher);
  const sk = storageKey(key);
  try {
    const data = await liveFetch;

    // The origin is authoritative: a successful live response is always returned,
    // even if the payload guard rejects it. The guard only decides whether the
    // response is trustworthy enough to CACHE — never whether the bootstrap-critical
    // caller gets its data. Throwing here would strand consumers such as
    // loadFedModules() (and, transitively, the whole app on <AppPlaceholder />)
    // whenever the schema drifts, which is strictly worse than serving live data.
    if (payloadGuard && !payloadGuard(data)) {
      console.warn(`[chrome] Live fetch for ${key} returned unexpected shape; returning it but skipping cache`);
      return { data, fromCache: false };
    }

    const envelope: CacheEnvelope<T> = { data, cachedAt: Date.now() };
    // Fire-and-forget: never block the bootstrap-critical path on the IndexedDB
    // write, and swallow storage errors — the fetch succeeded, that's what matters.
    void cacheFallbackPolicy.then((enabled) => {
      if (!enabled) {
        return;
      }
      void getCache()
        .setItem(sk, envelope)
        .catch((err) => {
          console.warn(`[chrome] Failed to cache ${key}:`, err);
        });
    });
    return { data, fromCache: false };
  } catch (err) {
    // Only use cache for origin failures (5xx) and network errors, not client errors (4xx)
    const cacheFallbackEnabled = await cacheFallbackPolicy;
    if (!cacheFallbackEnabled || !shouldUseCacheFallback(err)) {
      throw err;
    }

    const cached = await getCache()
      .getItem<unknown>(sk)
      .catch(() => null);
    if (isValidEnvelope<T>(cached, payloadGuard) && Date.now() - cached.cachedAt <= ttlMs) {
      return { data: cached.data, fromCache: true };
    }
    throw err;
  }
}
