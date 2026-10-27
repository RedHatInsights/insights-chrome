import { Access } from '@redhat-cloud-services/rbac-client/types';
import { ChromeUser } from '@redhat-cloud-services/types';
import { isAxiosError, isCancel } from 'axios';
import createRbacAPI, { RbacClient } from './rbac';
import logger from './logger';
import { getUnleashClient, unleashClientExists } from '../components/FeatureFlags/unleashClient';
import chromeStore from '../state/chromeStore';
import { PermissionCacheEntry, PermissionResult, permissionCacheAtom } from '../state/atoms/permissionCacheAtom';

const log = logger('fetchPermissions.ts');
const PER_PAGE = 1000;
// Measured from the failed attempt, never extended by cache reads. Retry is lazy.
export const RBAC_FAILURE_CACHE_TTL_MS = 30_000;

const isTransientFailure = (error: unknown): boolean =>
  isAxiosError(error) &&
  !isCancel(error) &&
  (error.response ? error.response.status >= 500 && error.response.status < 600 : ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? ''));

const isRbacSuppressed = (app: string) =>
  unleashClientExists() && (getUnleashClient().isEnabled('platform.rbac.workspaces') || (app === 'inventory' && getUnleashClient().isEnabled('hbi.rbac-v2')));

/** Clear both permission and HTTP caches, including work started before reset. */
export const resetPermissionCache = () => {
  chromeStore.set(permissionCacheAtom, (cache) => ({ generation: cache.generation + 1, entries: new Map() }));
};

/** Same-identity token renewal clears failures without interrupting active reads. */
export const invalidatePermissionFailures = () => {
  chromeStore.set(permissionCacheAtom, (cache) => ({
    ...cache,
    entries: new Map([...cache.entries].map(([app, entry]) => [app, { ...entry, retryAt: undefined }])),
  }));
};

const setEntry = (app: string, entry?: PermissionCacheEntry) => {
  chromeStore.set(permissionCacheAtom, (cache) => {
    const entries = new Map(cache.entries);
    if (entry) entries.set(app, entry);
    else entries.delete(app);
    return { ...cache, entries };
  });
};

const fetchPermissions = async (client: RbacClient, app: string): Promise<PermissionResult> => {
  try {
    const { data: firstPage } = await client.getPrincipalAccess({ application: app, limit: PER_PAGE });
    const { data, meta } = firstPage;
    if (!Array.isArray(data)) throw new Error('Invalid RBAC permission response');
    if (meta?.count && meta.count > PER_PAGE) {
      const pages = await Promise.all(
        [...new Array(Math.ceil(meta.count / PER_PAGE))].map((_, key) =>
          client.getPrincipalAccess({ application: app, limit: PER_PAGE, offset: (key + 1) * PER_PAGE })
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
    return { status: 'failure', cacheable: isTransientFailure(error) };
  }
};

const requestPermissions = async (app: string, client: RbacClient, generation: number): Promise<PermissionResult> => {
  const result = await fetchPermissions(client, app);
  const cache = chromeStore.get(permissionCacheAtom);
  if (cache.generation !== generation) return { status: 'failure', cacheable: false };
  // Flags can finish loading while the HTTP request is still in flight.
  if (isRbacSuppressed(app)) {
    setEntry(app);
    return { status: 'failure', cacheable: false };
  }
  const current = cache.entries.get(app);
  if (current?.client === client) {
    const retryAt = result.status === 'failure' && result.cacheable ? (current.retryAt ?? Date.now() + RBAC_FAILURE_CACHE_TTL_MS) : undefined;
    setEntry(app, { client, retryAt });
  }
  return result;
};

export const createFetchPermissionsWatcher = (getUser: () => Promise<void | ChromeUser>) => {
  const currentCall: Record<string, { client: RbacClient; permissions: Access[] }> = {};
  return async (_userToken: string, app = '', bypassCache = false): Promise<Access[]> => {
    const generation = chromeStore.get(permissionCacheAtom).generation;
    const user = await getUser();
    const cache = chromeStore.get(permissionCacheAtom);
    if (cache.generation !== generation) return [];
    const orgId = user?.identity?.org_id;
    if (orgId === undefined || orgId === null || orgId === '' || String(orgId) === '-1') return [];

    // Preserve the environment-level V1 gate and inventory V2 suppression.
    if (isRbacSuppressed(app)) {
      setEntry(app);
      return [];
    }
    let entry = cache.entries.get(app);
    if (!bypassCache && entry) {
      if (currentCall[app]?.client === entry.client) return currentCall[app].permissions;
      if (entry.retryAt !== undefined && Date.now() < entry.retryAt) return [];
    }
    if (!entry || (bypassCache && !entry.bypass)) {
      entry = { client: createRbacAPI() };
      setEntry(app, entry);
    } else if (entry.retryAt !== undefined) {
      entry = { ...entry, retryAt: undefined };
      setEntry(app, entry);
    }
    // A bypass skips completed caches, but concurrent callers share its request.
    const request = entry.bypass ?? requestPermissions(app, entry.client, generation);
    if (bypassCache && !entry.bypass) setEntry(app, { ...entry, bypass: request });
    const result = await request;
    const current = chromeStore.get(permissionCacheAtom);
    if (current.generation !== generation || result.status === 'failure') return [];
    // A response from before a bypass can finish without replacing newer data.
    if (current.entries.get(app)?.client === entry.client) currentCall[app] = { client: entry.client, permissions: result.permissions };
    return result.permissions;
  };
};
