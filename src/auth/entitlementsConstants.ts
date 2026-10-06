/** Bound so a hung `/api/entitlements/v1/services` call cannot block Chrome bootstrap. Matches `initChromeUserConfig`. */
export const ENTITLEMENTS_TIMEOUT_MS = 5000;

/** IndexedDB key inside `chrome-config-cache` (version prefix is added by cacheFetch). */
export const ENTITLEMENTS_CACHE_KEY = 'entitlements-services';

/** Independent rollout switch for the entire entitlements availability policy. */
export const ENTITLEMENTS_FALLBACK_FLAG = 'platform.chrome.entitlements-fallback';

/** Storage may delay fallback or logout by at most one second. */
export const ENTITLEMENTS_STORAGE_TIMEOUT_MS = 1000;

/** Never replay the legacy unscoped entry, including when the org ID is unavailable. */
export function getEntitlementsCacheKey(orgId: unknown): string | undefined {
  return typeof orgId === 'string' && orgId.length > 0 ? `${ENTITLEMENTS_CACHE_KEY}:org:${encodeURIComponent(orgId)}` : undefined;
}

/** Paid SKU last-known-good must not live as long as config cache (7d). */
export const ENTITLEMENTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const ENTITLEMENTS_BASE_PATH = '/api/entitlements/v1';
export const ENTITLEMENTS_SERVICES_PATH = '/api/entitlements/v1/services';
