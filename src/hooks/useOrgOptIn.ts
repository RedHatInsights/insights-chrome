import { useAtomValue, useSetAtom } from 'jotai';
import { useContext, useEffect, useRef } from 'react';
import { orgOptInAtom } from '../state/atoms/orgOptInAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { fetchOrgOptIn, resetOrgOptInCache } from '../utils/orgOptInApi';
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
 */
export function useOrgOptIn() {
  const state = useAtomValue(orgOptInAtom);
  const setState = useSetAtom(orgOptInAtom);
  const { user } = useContext(ChromeAuthContext);
  const orgId = user?.identity?.org_id ?? null;
  const lastFetchedOrgRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

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

    // Identity changed — reset module-level cache
    if (lastFetchedOrgRef.current !== null && lastFetchedOrgRef.current !== orgId) {
      resetOrgOptInCache();
    }

    lastFetchedOrgRef.current = orgId;
    setState({ status: 'loading', v2OptedIn: null, identityKey: orgId });

    fetchOrgOptIn(orgId).then((result) => {
      // Guard against unmounted hook or stale response after identity change
      if (cancelledRef.current || lastFetchedOrgRef.current !== orgId) {
        return;
      }

      if (result !== null) {
        setState({ status: 'resolved', v2OptedIn: result, identityKey: orgId });
      } else {
        // Error — reset ref so a remount can retry
        lastFetchedOrgRef.current = null;
        setState({ status: 'error', v2OptedIn: null, identityKey: orgId });
      }
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [orgId, setState]);

  // Only expose result when identityKey matches current orgId
  const matchesCurrent = state.identityKey === orgId || state.identityKey === null;

  return {
    /** `true` if org is V2 opted in, `false` if not, `null` if unknown (loading/error). */
    v2OptedIn: matchesCurrent ? state.v2OptedIn : null,
    /** `true` while the initial fetch is in progress. */
    isLoading: state.status === 'idle' || state.status === 'loading',
    /** `true` if the API call failed. */
    isError: state.status === 'error',
    /** `true` once the status is known (success). */
    isResolved: state.status === 'resolved',
  };
}
