/** Bound so a hung `/api/entitlements/v1/services` call cannot block Chrome bootstrap. Matches `initChromeUserConfig`. */
export const ENTITLEMENTS_TIMEOUT_MS = 5000;

/** IndexedDB key inside `chrome-config-cache` (version prefix is added by cacheFetch). */
export const ENTITLEMENTS_CACHE_KEY = 'entitlements-services';

/** Paid SKU last-known-good must not live as long as config cache (7d). */
export const ENTITLEMENTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const ENTITLEMENTS_BASE_PATH = '/api/entitlements/v1';
export const ENTITLEMENTS_SERVICES_PATH = '/api/entitlements/v1/services';
