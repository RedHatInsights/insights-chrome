import { AxiosError, CanceledError } from 'axios';
import { ChromeUser } from '@redhat-cloud-services/types';
import { RBAC_FAILURE_CACHE_TTL_MS, createFetchPermissionsWatcher, invalidatePermissionFailures, resetPermissionCache } from './fetchPermissions';
import { getUnleashClient, unleashClientExists } from '../components/FeatureFlags/unleashClient';

jest.unmock('axios');
const request = jest.fn();
jest.mock('./rbac', () => () => ({ getPrincipalAccess: (...args: unknown[]) => request(...args) }));
jest.mock('../components/FeatureFlags/unleashClient', () => ({
  unleashClientExists: jest.fn(() => false),
  getUnleashClient: jest.fn(),
}));

const permissions = [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }];
const response = (data = permissions) => ({ data: { data, meta: { count: data.length } } });
const unavailable = () => new AxiosError('unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 503 } as AxiosError['response']);
const makeUser = (orgId = 'org-a', accountId = 'user-a'): ChromeUser => ({
  identity: { org_id: orgId, type: 'User', internal: { org_id: orgId, account_id: accountId } },
  entitlements: {},
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

let user: ChromeUser | undefined;
let read: ReturnType<typeof createFetchPermissionsWatcher>;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1000);
  resetPermissionCache();
  request.mockReset().mockResolvedValue(response());
  jest.mocked(unleashClientExists).mockReturnValue(false);
  user = makeUser();
  read = createFetchPermissionsWatcher(async () => user);
});

afterEach(() => {
  resetPermissionCache();
  jest.useRealTimers();
});

it('shares an outage between watchers and does not extend the TTL on repeated reads', async () => {
  request.mockRejectedValueOnce(unavailable());
  const other = createFetchPermissionsWatcher(async () => user);
  await expect(read('token')).resolves.toEqual([]);
  for (const elapsed of [1, 10_000, RBAC_FAILURE_CACHE_TTL_MS - 1]) {
    jest.setSystemTime(1000 + elapsed);
    await expect(Promise.all([read('token'), other('token')])).resolves.toEqual([[], []]);
  }
  expect(request).toHaveBeenCalledTimes(1);
  jest.setSystemTime(1000 + RBAC_FAILURE_CACHE_TTL_MS);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(RBAC_FAILURE_CACHE_TTL_MS * 2);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
});

it('starts the TTL when the failed attempt finishes and bounds consecutive outages', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  const started = deferred<void>();
  request.mockImplementationOnce(() => {
    started.resolve();
    return pending.promise;
  });
  const first = read('token');
  await started.promise;
  jest.advanceTimersByTime(5000);
  pending.reject(unavailable());
  await expect(first).resolves.toEqual([]);
  jest.advanceTimersByTime(RBAC_FAILURE_CACHE_TTL_MS - 1);
  await read('token');
  expect(request).toHaveBeenCalledTimes(1);
  request.mockRejectedValueOnce(unavailable());
  jest.advanceTimersByTime(1);
  await read('token');
  await read('token');
  expect(request).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(RBAC_FAILURE_CACHE_TTL_MS);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(3);
});

it('keeps successful empty permissions cached beyond the failure TTL', async () => {
  request.mockResolvedValueOnce(response([]));
  await expect(read('token')).resolves.toEqual([]);
  jest.advanceTimersByTime(RBAC_FAILURE_CACHE_TTL_MS * 2);
  await expect(read('token')).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
});

it('isolates applications and bypasses only the requested application', async () => {
  request.mockRejectedValueOnce(unavailable());
  await read('token', 'inventory');
  await expect(read('token', 'sources')).resolves.toEqual(permissions);
  await expect(read('token', 'inventory')).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(2);
  await expect(read('token', 'inventory', true)).resolves.toEqual(permissions);
  await read('token', 'sources');
  expect(request).toHaveBeenCalledTimes(3);
});

it.each(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'])('caches %s failures', async (code) => {
  request.mockRejectedValueOnce(new AxiosError('transport failed', code));
  await read('token');
  await read('token');
  expect(request).toHaveBeenCalledTimes(1);
});

it.each([500, 502, 503, 504])('caches HTTP %s failures', async (status) => {
  request.mockRejectedValueOnce(new AxiosError('HTTP failure', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosError['response']));
  await read('token');
  await read('token');
  expect(request).toHaveBeenCalledTimes(1);
});

it.each([401, 403, 404, 429])('preserves next-read behavior for HTTP %s without automatic retries', async (status) => {
  request.mockRejectedValueOnce(new AxiosError('HTTP failure', 'ERR_BAD_REQUEST', undefined, undefined, { status } as AxiosError['response']));
  await expect(read('token')).resolves.toEqual([]);
  jest.advanceTimersByTime(RBAC_FAILURE_CACHE_TTL_MS * 2);
  expect(request).toHaveBeenCalledTimes(1);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
});

it.each([new CanceledError(), new Error('unexpected failure')])('does not negative-cache cancellation or non-transport failures', async (error) => {
  request.mockRejectedValueOnce(error);
  await expect(read('token')).resolves.toEqual([]);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
});

it.each([undefined, makeUser(''), makeUser('-1')])('skips requests when the org identity is unavailable', async (missingUser) => {
  user = missingUser;
  await expect(read('token')).resolves.toEqual([]);
  expect(request).not.toHaveBeenCalled();
});

it('clears failures on token renewal while retaining successful permissions', async () => {
  request.mockRejectedValueOnce(unavailable());
  await read('old-token', 'inventory');
  await read('old-token', 'sources');
  invalidatePermissionFailures();
  await expect(read('new-token', 'inventory')).resolves.toEqual(permissions);
  await expect(read('new-token', 'sources')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(3);
});

it.each(['success', 'failure'])('preserves a pending read across token renewal until its %s', async (outcome) => {
  const pending = deferred<ReturnType<typeof response>>();
  const started = deferred<void>();
  request.mockImplementationOnce(() => {
    started.resolve();
    return pending.promise;
  });
  const first = read('old-token');
  await started.promise;
  invalidatePermissionFailures();
  if (outcome === 'success') pending.resolve(response());
  else pending.reject(unavailable());
  const expected = outcome === 'success' ? permissions : [];
  await expect(first).resolves.toEqual(expected);
  await expect(read('new-token')).resolves.toEqual(expected);
  expect(request).toHaveBeenCalledTimes(1);
});

it.each(['success', 'failure'])('resets %s results across existing watchers', async (outcome) => {
  if (outcome === 'failure') request.mockRejectedValueOnce(unavailable());
  const other = createFetchPermissionsWatcher(async () => user);
  await read('token');
  await other('token');
  resetPermissionCache();
  request.mockClear();
  request.mockResolvedValue(response([]));
  await expect(read('token')).resolves.toEqual([]);
  await expect(other('token')).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(2);
});

it.each(['success', 'failure'])('discards a late %s after reset without repopulating the cache', async (outcome) => {
  const pending = deferred<ReturnType<typeof response>>();
  const started = deferred<void>();
  request.mockImplementationOnce(() => {
    started.resolve();
    return pending.promise;
  });
  const first = read('token');
  await started.promise;
  resetPermissionCache();
  if (outcome === 'success') pending.resolve(response([]));
  else pending.reject(unavailable());
  await expect(first).resolves.toEqual([]);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
});

it('ignores a user lookup that resolves after reset', async () => {
  const oldUser = deferred<ChromeUser>();
  const oldRead = createFetchPermissionsWatcher(() => oldUser.promise)('token');
  resetPermissionCache();
  oldUser.resolve(makeUser());
  await expect(oldRead).resolves.toEqual([]);
  expect(request).not.toHaveBeenCalled();
  await expect(read('token')).resolves.toEqual(permissions);
});

it.each(['first', 'later'])('does not cache a malformed %s page as successful permissions', async (page) => {
  if (page === 'later') request.mockResolvedValueOnce({ data: { data: permissions, meta: { count: 1001 } } });
  request.mockResolvedValueOnce({ data: { data: { permission: 'not-an-array' }, meta: { count: 1 } } });
  await expect(read('token')).resolves.toEqual([]);
  const requests = request.mock.calls.length;
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(requests + 1);
});

it.each(['platform.rbac.workspaces', 'hbi.rbac-v2'])('does not treat suppression by %s as an outage or cache its empty result', async (flag) => {
  jest.mocked(unleashClientExists).mockReturnValue(true);
  jest.mocked(getUnleashClient).mockReturnValue({ isEnabled: (name: string) => name === flag } as ReturnType<typeof getUnleashClient>);
  await expect(read('token', 'inventory')).resolves.toEqual([]);
  expect(request).not.toHaveBeenCalled();
  jest.mocked(unleashClientExists).mockReturnValue(false);
  await expect(read('token', 'inventory')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(1);
});

it.each(['platform.rbac.workspaces', 'hbi.rbac-v2'])('honors %s suppression that becomes active during a request', async (flag) => {
  const pending = deferred<ReturnType<typeof response>>();
  const started = deferred<void>();
  request.mockImplementationOnce(() => {
    started.resolve();
    return pending.promise;
  });
  const first = read('token', 'inventory');
  await started.promise;
  jest.mocked(unleashClientExists).mockReturnValue(true);
  jest.mocked(getUnleashClient).mockReturnValue({ isEnabled: (name: string) => name === flag } as ReturnType<typeof getUnleashClient>);
  pending.resolve(response());
  await expect(first).resolves.toEqual([]);
  await expect(read('token', 'inventory')).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
});
