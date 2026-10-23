import { Access } from '@redhat-cloud-services/rbac-client/types';
import { ChromeUser } from '@redhat-cloud-services/types';
import { isAxiosError, isCancel } from 'axios';
import createRbacAPI from './rbac';
import logger from './logger';
import { getUnleashClient, unleashClientExists } from '../components/FeatureFlags/unleashClient';
import chromeStore from '../state/chromeStore';
import { PermissionCacheEntry, permissionCacheAtom } from '../state/atoms/permissionCacheAtom';

const log = logger('fetchPermissions.ts');
const PER_PAGE = 1000;
// Measured from the failed attempt, never extended by cache reads. Retry is lazy.
export const RBAC_FAILURE_CACHE_TTL_MS = 30_000;

type PermissionResult = { status: 'success'; permissions: Access[] } | { status: 'failure'; cacheable: boolean };

const isTransientFailure = (error: unknown): boolean =>
  isAxiosError(error) &&
  !isCancel(error) &&
  (error.response ? error.response.status >= 500 && error.response.status < 600 : ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? ''));

const abortEntry = (entry: PermissionCacheEntry) => {
  if (entry.status === 'pending') entry.controller.abort();
};

const isRbacSuppressed = (app: string) =>
  unleashClientExists() && (getUnleashClient().isEnabled('platform.rbac.workspaces') || (app === 'inventory' && getUnleashClient().isEnabled('hbi.rbac-v2')));

/** Clear both permission and HTTP caches, including work started before reset. */
export const resetPermissionCache = () => {
  const cache = chromeStore.get(permissionCacheAtom);
  chromeStore.set(permissionCacheAtom, { generation: cache.generation + 1, entries: new Map() });
  cache.entries.forEach(abortEntry);
};

/** Same-identity token renewal clears failures without interrupting active reads. */
export const invalidatePermissionFailures = () => {
  const cache = chromeStore.get(permissionCacheAtom);
  chromeStore.set(permissionCacheAtom, {
    ...cache,
    generation: cache.generation + 1,
    entries: new Map([...cache.entries].filter(([, entry]) => entry.status !== 'failure')),
  });
};

const discardApp = (app: string) => {
  const cache = chromeStore.get(permissionCacheAtom);
  const entry = cache.entries.get(app);
  if (entry) {
    const entries = new Map(cache.entries);
    entries.delete(app);
    chromeStore.set(permissionCacheAtom, { ...cache, entries });
    abortEntry(entry);
  }
};

const fetchPermissions = async (client: ReturnType<typeof createRbacAPI>, app: string, signal: AbortSignal): Promise<PermissionResult> => {
  try {
    const { data: firstPage } = await client.getPrincipalAccess({ application: app, limit: PER_PAGE, options: { signal } });
    const { data, meta } = firstPage;
    if (!Array.isArray(data)) throw new Error('Invalid RBAC permission response');
    if (meta?.count && meta.count > PER_PAGE) {
      const pages = await Promise.all(
        [...new Array(Math.ceil(meta.count / PER_PAGE))].map((_, key) =>
          client.getPrincipalAccess({ application: app, limit: PER_PAGE, offset: (key + 1) * PER_PAGE, options: { signal } })
        )
      );
      const permissions = pages.reduce((all, page) => {
        if (!Array.isArray(page.data.data)) throw new Error('Invalid RBAC permission response');
        return [...all, ...page.data.data];
      }, data);
      return { status: 'success', permissions };
    }
    return { status: 'success', permissions: data };
  } catch (error) {
    if (!isCancel(error)) log(error);
    return { status: 'failure', cacheable: !signal.aborted && isTransientFailure(error) };
  }
};

export const createFetchPermissionsWatcher = (getUser: () => Promise<void | ChromeUser>) => {
  // Incomplete identities must not share permissions with another watcher.
  const anonymousUserId = Symbol('permission-watcher');
  return async (_userToken: string, app = '', bypassCache?: boolean): Promise<Access[]> => {
    const generation = chromeStore.get(permissionCacheAtom).generation;
    const user = await getUser();
    let cache = chromeStore.get(permissionCacheAtom);
    const orgId = user?.identity?.org_id;
    if (orgId === undefined || orgId === null || orgId === '' || String(orgId) === '-1') {
      if (cache.generation === generation) resetPermissionCache();
      return [];
    }
    const principal = user?.identity?.internal?.account_id || user?.identity?.user?.username;
    const identity = {
      orgId: String(orgId),
      userId: principal ? JSON.stringify([user?.identity?.type, user?.identity?.internal?.account_id ? 'account-id' : 'username', principal]) : anonymousUserId,
    };
    const sameIdentity = cache.identity?.orgId === identity.orgId && cache.identity?.userId === identity.userId;
    // A concurrent read may have already selected this identity. An older
    // identity lookup must never undo a reset or switch back from another user.
    if (cache.generation !== generation && !sameIdentity) return [];
    if (!sameIdentity) {
      resetPermissionCache();
      cache = { ...chromeStore.get(permissionCacheAtom), identity };
      chromeStore.set(permissionCacheAtom, cache);
    }

    // Preserve the environment-level V1 gate (RHCLOUD-49749) and inventory V2
    // suppression. Skipping V1 is not a failed request or a cached empty result.
    if (isRbacSuppressed(app)) {
      discardApp(app);
      return [];
    }
    if (bypassCache) discardApp(app);
    cache = chromeStore.get(permissionCacheAtom);
    const entry = cache.entries.get(app);
    if (entry?.status === 'success') return entry.permissions;
    if (entry?.status === 'pending') return entry.promise;
    if (entry?.status === 'failure' && Date.now() < entry.retryAt) return [];

    // Retain successful HTTP pages for a retry in the same identity. A bypass,
    // reset or identity change creates a fresh client with an empty HTTP cache.
    const client = entry?.client ?? createRbacAPI();
    const controller = new AbortController();
    const owner = cache.identity;
    const pending: PermissionCacheEntry = {
      client,
      status: 'pending',
      controller,
      promise: Promise.resolve().then(async () => {
        const result = await fetchPermissions(client, app, controller.signal);
        const current = chromeStore.get(permissionCacheAtom);
        const replacement = current.entries.get(app);
        if (replacement !== pending) {
          // A bypass replaces the request for its existing callers too. The
          // identity object also isolates resets that return to the same user.
          if (current.identity !== owner || isRbacSuppressed(app)) return [];
          if (replacement?.status === 'pending') return replacement.promise;
          if (replacement?.status === 'success') return replacement.permissions;
          return [];
        }
        // Flags can finish loading while the HTTP request is still in flight.
        if (isRbacSuppressed(app)) {
          discardApp(app);
          return [];
        }
        const entries = new Map(current.entries);
        if (result.status === 'success') {
          entries.set(app, { client, ...result });
        } else if (result.cacheable) {
          entries.set(app, { client, status: 'failure', retryAt: Date.now() + RBAC_FAILURE_CACHE_TTL_MS });
        } else {
          entries.delete(app);
        }
        chromeStore.set(permissionCacheAtom, { ...current, entries });
        return result.status === 'success' ? result.permissions : [];
      }),
    };
    chromeStore.set(permissionCacheAtom, { ...cache, entries: new Map(cache.entries).set(app, pending) });
    return pending.promise;
  };
};
