import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useContext, useEffect, useRef } from 'react';
import { orgOptInAtom } from '../state/atoms/orgOptInAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { fetchOrgOptIn } from '../utils/orgOptInApi';
import { ITLess } from '../utils/common';

/**
 * Hook to access the org V2 opt-in status via the RBAC API.
 *
 * - ITLess: always resolves to `false` (no request sent).
 * - Deduplicates concurrent calls across components.
 * - Caches for 120s, scoped to active identity.
 * - Failures are not cached; components can retry on remount.
 * - Pending/error state is NOT treated as confirmed V1.
 * - Clears shared state when identity disappears.
 * - Uses a request token per effect to prevent A→B→A race conditions.
 */
export function useOrgOptIn() {
  const state = useAtomValue(orgOptInAtom);
  const setState = useSetAtom(orgOptInAtom);
  const store = useStore();
  const { user } = useContext(ChromeAuthContext);
  const orgId = user?.identity?.org_id ?? null;
  const lastFetchedOrgRef = useRef<string | null>(null);
  /**
   * Monotonically increasing token. Each effect execution gets its own value;
   * an earlier request whose token no longer matches is silently discarded.
   */
  const requestTokenRef = useRef(0);

  useEffect(() => {
    // Mint a new token for this effect execution, invalidating all prior ones.
    const token = ++requestTokenRef.current;

    // ITLess environments: never send opt-in request
    if (ITLess()) {
      setState({ status: 'resolved', v2OptedIn: false, identityKey: null });
      return;
    }

    if (!orgId) {
      // Identity disappeared — clear stale result
      lastFetchedOrgRef.current = null;
      setState({ status: 'idle', v2OptedIn: null, identityKey: null });
      return;
    }

    // Already fetched successfully for this identity
    if (orgId === lastFetchedOrgRef.current) {
      return;
    }

    lastFetchedOrgRef.current = orgId;
    // Preserve an already-resolved shared state for the same org so that a
    // newly mounted subscriber doesn't flash 'loading' while the background
    // refresh is in flight (the atom is shared across all consumers).
    const current = store.get(orgOptInAtom);
    const alreadyResolved = current.status === 'resolved' && current.identityKey === orgId;
    if (!alreadyResolved) {
      setState({ status: 'loading', v2OptedIn: null, identityKey: orgId });
    }

    fetchOrgOptIn(orgId).then((result) => {
      // Discard if a newer effect execution has since started.
      // Token minting at the top of this effect (++requestTokenRef.current)
      // already ensures stale responses from prior identity changes are
      // discarded.  No cleanup function is needed — removing it prevents
      // subscriber unmount from discarding a valid in-flight response that
      // other mounted consumers depend on (the atom is shared).
      if (requestTokenRef.current !== token) {
        return;
      }

      if (result !== null) {
        setState({ status: 'resolved', v2OptedIn: result, identityKey: orgId });
      } else {
        // Error — reset ref so a remount can retry
        lastFetchedOrgRef.current = null;
        // Preserve an already-resolved result for the same identity
        // (another hook instance may have resolved successfully)
        const currentState = store.get(orgOptInAtom);
        if (currentState.status === 'resolved' && currentState.identityKey === orgId) {
          return;
        }
        setState({ status: 'error', v2OptedIn: null, identityKey: orgId });
      }
    });
  }, [orgId, setState, store]);

  // Status flags are scoped to the current identity: a stale result for a
  // different org is treated as loading/unresolved until the new request lands.
  const matchesCurrent = state.identityKey === orgId || state.identityKey === null;

  return {
    /** `true` if org is V2 opted in, `false` if not, `null` if unknown (loading/error). */
    v2OptedIn: matchesCurrent ? state.v2OptedIn : null,
    /** `true` while the initial fetch is in progress or result is stale. */
    isLoading: !matchesCurrent || state.status === 'idle' || state.status === 'loading',
    /** `true` if the API call failed for the current identity. */
    isError: matchesCurrent && state.status === 'error',
    /** `true` once the status is known (success) for the current identity. */
    isResolved: matchesCurrent && state.status === 'resolved',
  };
}
