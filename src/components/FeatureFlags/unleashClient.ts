import { UnleashClient } from '@unleash/proxy-client-react';

let unleashClient: UnleashClient;

export const UNLEASH_ERROR_KEY = 'chrome:feature-flags:error';

/** Timeout for feature flag requests made before the client is ready. Blocks initial navigation. */
export const FEATURE_FLAGS_INITIAL_TIMEOUT_MS = 5_000;
/** Timeout for background refresh requests. Cached toggles are served meanwhile, so allow slow proxies. */
export const FEATURE_FLAGS_REFRESH_TIMEOUT_MS = 15_000;

const UNLEASH_STORAGE_PREFIX = 'unleash:repository';
const LEGACY_UNLEASH_STORAGE_KEYS = ['repo', 'sessionId', 'repoLastUpdateTimestamp'].map((key) => `${UNLEASH_STORAGE_PREFIX}:${key}`);

/**
 * Toggles are cached per org and user, so a shared browser never evaluates one account's navigation
 * with another account's toggles. Returns undefined when the identity is incomplete.
 */
export const getFeatureFlagsStoragePrefix = (orgId?: string, userId?: string) => (orgId && userId ? `${UNLEASH_STORAGE_PREFIX}:${orgId}:${userId}` : undefined);

/**
 * Remove toggles cached by earlier Chrome versions under the unscoped key.
 */
export const clearLegacyFeatureFlagsCache = () => {
  try {
    LEGACY_UNLEASH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // storage may be unavailable
  }
};

/**
 * Clear error localstorage flag before initialization
 */
localStorage.setItem(UNLEASH_ERROR_KEY, 'false');

export const getFeatureFlagsError = () => localStorage.getItem(UNLEASH_ERROR_KEY) === 'true';

export const setFeatureFlagsError = (hasError: boolean) => localStorage.setItem(UNLEASH_ERROR_KEY, String(hasError));

export function getUnleashClient() {
  if (!unleashClient) {
    throw new Error('UnleashClient not initialized!');
  }
  return unleashClient;
}

export function setUnleashClient(client: UnleashClient) {
  unleashClient = client;
}

export function unleashClientExists() {
  return !!unleashClient;
}
