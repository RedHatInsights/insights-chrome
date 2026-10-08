import axios from 'axios';

const CACHE_TTL_MS = 120_000; // 120 seconds — matches API Cache-Control: max-age=120
const REQUEST_TIMEOUT_MS = 10_000;

interface CacheEntry {
  v2OptedIn: boolean;
  expiresAt: number;
  identityKey: string;
}

let cachedResult: CacheEntry | null = null;
let inflightPromise: Promise<boolean | null> | null = null;
let inflightIdentityKey: string | null = null;
let requestGeneration = 0;

/**
 * Reset the org opt-in cache. Call on identity change or for testing.
 */
export function resetOrgOptInCache(): void {
  cachedResult = null;
  inflightPromise = null;
  inflightIdentityKey = null;
  requestGeneration++;
}

/**
 * Fetch the org V2 opt-in status from RBAC API.
 *
 * - Deduplicates concurrent requests for the same identity.
 * - Caches successful results for 120 seconds (consistent with API Cache-Control).
 * - Identity-scoped: a new identityKey invalidates stale cache/in-flight.
 * - Does NOT cache failures — subsequent calls retry.
 *
 * @param identityKey - Org ID or similar identity key scoping the cache.
 * @returns `true` if opted in, `false` if not, `null` on failure/timeout.
 */
export async function fetchOrgOptIn(identityKey: string): Promise<boolean | null> {
  if (!identityKey) {
    return null;
  }

  // Cache hit with matching identity
  if (cachedResult && cachedResult.identityKey === identityKey && Date.now() < cachedResult.expiresAt) {
    return cachedResult.v2OptedIn;
  }

  // Identity changed — invalidate everything
  if ((cachedResult && cachedResult.identityKey !== identityKey) || (inflightIdentityKey && inflightIdentityKey !== identityKey)) {
    cachedResult = null;
    inflightPromise = null;
    inflightIdentityKey = null;
  }

  // Deduplicate concurrent requests
  if (inflightPromise) {
    return inflightPromise;
  }

  const generation = ++requestGeneration;
  inflightIdentityKey = identityKey;
  inflightPromise = (async () => {
    try {
      const response = await axios.get('/api/rbac/v1/tenant/opt-in/', {
        timeout: REQUEST_TIMEOUT_MS,
      });
      const rawValue = response.data?.v2_opted_in;
      if (typeof rawValue !== 'boolean') {
        console.error('Malformed org opt-in response: v2_opted_in is not a boolean');
        return null;
      }
      if (generation === requestGeneration) {
        cachedResult = {
          v2OptedIn: rawValue,
          expiresAt: Date.now() + CACHE_TTL_MS,
          identityKey,
        };
      }
      return rawValue;
    } catch (error) {
      console.error('Failed to fetch org opt-in status:', error);
      // Don't cache failure — allow retry on next call
      return null;
    } finally {
      if (generation === requestGeneration) {
        inflightPromise = null;
        inflightIdentityKey = null;
      }
    }
  })();

  return inflightPromise;
}
