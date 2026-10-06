import localforage from 'localforage';
import { AuthContextProps } from 'react-oidc-context';
import { logout } from './utils';
import { EntitlementsClient, clearEntitlementsCache, fetchEntitlements } from '../fetchEntitlements';
import { ENTITLEMENTS_CACHE_TTL_MS, ENTITLEMENTS_STORAGE_TIMEOUT_MS, ENTITLEMENTS_TIMEOUT_MS, getEntitlementsCacheKey } from '../entitlementsConstants';
import { DEGRADED_HEADERS, failureA, healthyPaid, healthyUnsubscribed, orgIdUserProfile } from '../entitlementsContract.fixture';

jest.mock('localforage', () => ({ createInstance: jest.fn(), INDEXEDDB: 'idb', WEBSQL: 'sql', LOCALSTORAGE: 'local' }));

const entries = new Map<string, unknown>();
const getItem = jest.fn();
const setItem = jest.fn();
const removeItem = jest.fn();
const servicesGet = jest.fn();
const client: EntitlementsClient = { servicesGet };
const user = { profile: orgIdUserProfile };
const key = `v1:${getEntitlementsCacheKey(orgIdUserProfile.org_id)}`;
const response = (data = healthyPaid, headers = {}) => ({ data, headers });

async function flushBackground() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('entitlements with real cacheFetch', () => {
  beforeEach(() => {
    entries.clear();
    getItem.mockReset().mockImplementation(async (key: string) => entries.get(key) ?? null);
    setItem.mockReset().mockImplementation(async (key: string, value: unknown) => {
      entries.set(key, value);
    });
    removeItem.mockReset().mockImplementation(async (key: string) => {
      entries.delete(key);
    });
    jest.mocked(localforage.createInstance).mockReturnValue({ getItem, setItem, removeItem } as unknown as LocalForage);
    servicesGet.mockReset().mockRejectedValue({ response: { status: 503 } });
  });

  afterEach(() => jest.useRealTimers());

  it('uses only the current organization cache, never the shared or another org entry', async () => {
    entries.set('v1:entitlements-services', { data: healthyPaid, cachedAt: Date.now() });
    entries.set('v1:entitlements-services:org:other', { data: healthyPaid, cachedAt: Date.now() });
    const result = await fetchEntitlements(user, { enabled: true, client });
    expect(result.source).toBe('defaults');
    expect(result.entitlements.ansible.is_entitled).toBe(false);
    expect(getItem).toHaveBeenCalledWith(key);
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('replays a valid same-org cache after an outage', async () => {
    entries.set(key, { data: healthyPaid, cachedAt: Date.now() });
    expect(await fetchEntitlements(user, { enabled: true, client })).toEqual({ entitlements: healthyPaid, degraded: true, source: 'cache' });
  });

  it('bypasses the legacy URL-only HTTP cache only in the enabled path', async () => {
    servicesGet.mockResolvedValue(response());
    await fetchEntitlements(user, { enabled: true, client });
    expect(servicesGet).toHaveBeenCalledWith({
      options: expect.objectContaining({ cache: false, timeout: ENTITLEMENTS_TIMEOUT_MS, signal: expect.any(AbortSignal) }),
    });
    await flushBackground();
    servicesGet.mockClear();
    await fetchEntitlements(user, { client });
    expect(servicesGet).toHaveBeenCalledWith({});
  });

  it.each(['expired', 'malformed'])('does not replay an %s entry or persist synthesized defaults', async (kind) => {
    entries.set(key, kind === 'expired' ? { data: healthyPaid, cachedAt: Date.now() - ENTITLEMENTS_CACHE_TTL_MS - 1 } : { data: [], cachedAt: Date.now() });
    const result = await fetchEntitlements(user, { enabled: true, client });
    await flushBackground();
    expect(result.source).toBe('defaults');
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404])('does not read stored entitlements for HTTP %s', async (status) => {
    entries.set(key, { data: healthyPaid, cachedAt: Date.now() });
    servicesGet.mockRejectedValue({ response: { status } });
    const result = await fetchEntitlements(user, { enabled: true, client });
    expect(result.source).toBe('defaults');
    expect(getItem).not.toHaveBeenCalled();
    expect(servicesGet).toHaveBeenCalledTimes(1);
  });

  it('returns live data even when the persistence read never settles', async () => {
    getItem.mockImplementation(() => new Promise(() => {}));
    servicesGet.mockResolvedValue(response());
    const result = await fetchEntitlements(user, { enabled: true, client });
    expect(result).toEqual({ entitlements: healthyPaid, degraded: false, source: 'live' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('honors a degraded live body without replacing a richer cache', async () => {
    entries.set(key, { data: healthyPaid, cachedAt: Date.now() });
    servicesGet.mockResolvedValue(response(failureA, DEGRADED_HEADERS));
    const result = await fetchEntitlements(user, { enabled: true, client });
    await flushBackground();
    expect(result).toEqual({ entitlements: failureA, degraded: true, source: 'live' });
    expect(setItem).not.toHaveBeenCalled();
    expect(entries.get(key)).toEqual({ data: healthyPaid, cachedAt: expect.any(Number) });
  });

  it.each(['server error', 'timeout'])('bounds a stalled fallback read after %s', async (kind) => {
    jest.useFakeTimers();
    getItem.mockImplementation(() => new Promise(() => {}));
    if (kind === 'timeout') {
      // Deliberately ignore AbortSignal: the deadline must settle independently.
      servicesGet.mockImplementation(() => new Promise(() => {}));
    }
    const pending = fetchEntitlements(user, { enabled: true, client, previous: healthyPaid });
    await jest.advanceTimersByTimeAsync((kind === 'timeout' ? ENTITLEMENTS_TIMEOUT_MS : 0) + ENTITLEMENTS_STORAGE_TIMEOUT_MS);
    expect(await pending).toEqual({ entitlements: healthyPaid, degraded: true, source: 'memory' });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ignores a live response that arrives after the deadline', async () => {
    jest.useFakeTimers();
    let resolve!: (value: ReturnType<typeof response>) => void;
    servicesGet.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const pending = fetchEntitlements(user, { enabled: true, client });
    await jest.advanceTimersByTimeAsync(ENTITLEMENTS_TIMEOUT_MS + ENTITLEMENTS_STORAGE_TIMEOUT_MS);
    expect((await pending).source).toBe('defaults');
    resolve(response());
    await jest.advanceTimersByTimeAsync(0);
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([true, false])('bounds stalled deletion without blocking logout (bounce=%s)', async (bounce) => {
    jest.useFakeTimers();
    entries.set(key, { data: healthyPaid, cachedAt: Date.now() });
    let finishDelete!: () => void;
    removeItem.mockImplementation(
      () =>
        new Promise<void>((done) => {
          finishDelete = () => {
            entries.delete(key);
            done();
          };
        })
    );
    const auth = {
      user,
      revokeTokens: jest.fn().mockResolvedValue(undefined),
      signoutRedirect: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuthContextProps;
    const pending = logout(auth, bounce, true);
    await jest.advanceTimersByTimeAsync(ENTITLEMENTS_STORAGE_TIMEOUT_MS);
    await pending;
    expect(bounce ? auth.signoutRedirect : auth.revokeTokens).toHaveBeenCalled();
    expect(removeItem).toHaveBeenCalledWith(key);
    finishDelete();
    await jest.advanceTimersByTimeAsync(0);
    expect(entries.has(key)).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('invalidates a fetch that resolves after logout', async () => {
    let resolve!: (value: ReturnType<typeof response>) => void;
    servicesGet.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const pending = fetchEntitlements(user, { enabled: true, client });
    await Promise.resolve();
    await clearEntitlementsCache(orgIdUserProfile.org_id);
    resolve(response());
    await pending;
    await flushBackground();
    expect(setItem).not.toHaveBeenCalled();
    expect(entries.has(key)).toBe(false);
  });

  it('deletes an already-started late write before permitting a new session to persist', async () => {
    jest.useFakeTimers();
    let finishWrite!: () => void;
    setItem.mockImplementationOnce(
      (key: string, value: unknown) =>
        new Promise<void>((done) => {
          finishWrite = () => {
            entries.set(key, value);
            done();
          };
        })
    );
    servicesGet.mockResolvedValue(response());
    await fetchEntitlements(user, { enabled: true, client });
    await jest.advanceTimersByTimeAsync(0);
    expect(setItem).toHaveBeenCalledTimes(1);
    const deletion = clearEntitlementsCache(orgIdUserProfile.org_id);
    await jest.advanceTimersByTimeAsync(ENTITLEMENTS_STORAGE_TIMEOUT_MS);
    await deletion;
    servicesGet.mockResolvedValue(response(healthyUnsubscribed));
    await fetchEntitlements(user, { enabled: true, client });
    expect(setItem).toHaveBeenCalledTimes(1);
    finishWrite();
    await jest.advanceTimersByTimeAsync(0);
    expect(removeItem).toHaveBeenCalledTimes(2);
    expect(entries.get(key)).toEqual({ data: healthyUnsubscribed, cachedAt: expect.any(Number) });
  });

  it('does not touch persisted entitlements or impose options when disabled', async () => {
    entries.set(key, { data: healthyPaid, cachedAt: Date.now() });
    expect((await fetchEntitlements(user, { client, previous: healthyPaid })).entitlements).toEqual({});
    expect(servicesGet).toHaveBeenCalledWith({});
    expect(servicesGet).toHaveBeenCalledTimes(1);
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    const auth = { user, revokeTokens: jest.fn().mockResolvedValue(undefined) } as unknown as AuthContextProps;
    await logout(auth, false);
    expect(removeItem).not.toHaveBeenCalled();
    expect(entries.has(key)).toBe(true);
  });
});
