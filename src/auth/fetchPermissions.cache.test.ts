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
  await expect(Promise.all([read('token'), other('token')])).resolves.toEqual([permissions, permissions]);
  expect(request).toHaveBeenCalledTimes(2);
  jest.advanceTimersByTime(RBAC_FAILURE_CACHE_TTL_MS * 2);
  await expect(other('token')).resolves.toEqual(permissions);
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

it('shares successful concurrent reads, including reads from a second watcher', async () => {
  const other = createFetchPermissionsWatcher(async () => user);
  await expect(Promise.all([read('token'), other('token'), read('token')])).resolves.toEqual([permissions, permissions, permissions]);
  expect(request).toHaveBeenCalledTimes(1);
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

it.each([makeUser('org-b'), makeUser('org-a', 'user-b')])('invalidates failures when the org or user changes', async (nextUser) => {
  request.mockRejectedValueOnce(unavailable());
  await read('token');
  user = nextUser;
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
});

it.each([undefined, makeUser(''), makeUser('-1')])('clears previous results when the identity is unavailable', async (missingUser) => {
  request.mockRejectedValueOnce(unavailable());
  await read('token');
  user = missingUser;
  await expect(read('token')).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
  user = makeUser();
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
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
  expect(request.mock.calls[0][0].options.signal.aborted).toBe(false);
  const other = createFetchPermissionsWatcher(async () => user);
  const renewed = other('new-token');
  if (outcome === 'success') pending.resolve(response());
  else pending.reject(unavailable());
  const expected = outcome === 'success' ? permissions : [];
  await expect(Promise.all([first, renewed])).resolves.toEqual([expected, expected]);
  await expect(read('new-token')).resolves.toEqual(expected);
  expect(request).toHaveBeenCalledTimes(1);
});

it('resets failures across all watchers', async () => {
  request.mockRejectedValueOnce(unavailable());
  await read('token');
  resetPermissionCache();
  const other = createFetchPermissionsWatcher(async () => user);
  await expect(other('token')).resolves.toEqual(permissions);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
});

it.each(['reset', 'identity'])('discards a late failure after %s', async (action) => {
  const pending = deferred<ReturnType<typeof response>>();
  const started = deferred<void>();
  request.mockImplementationOnce(() => {
    started.resolve();
    return pending.promise;
  });
  const first = read('token');
  await started.promise;
  if (action === 'reset') resetPermissionCache();
  if (action === 'identity') user = makeUser('org-b');
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request.mock.calls[0][0].options.signal.aborted).toBe(true);
  pending.reject(unavailable());
  await expect(first).resolves.toEqual([]);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(2);
});

it.each(['pending', 'success', 'failure'])('returns the %s replacement result to a read cancelled by bypass', async (replacementStatus) => {
  const original = deferred<ReturnType<typeof response>>();
  const replacement = deferred<ReturnType<typeof response>>();
  const originalStarted = deferred<void>();
  const replacementStarted = deferred<void>();
  request
    .mockImplementationOnce(() => {
      originalStarted.resolve();
      return original.promise;
    })
    .mockImplementationOnce(() => {
      replacementStarted.resolve();
      return replacement.promise;
    });
  const first = read('token');
  await originalStarted.promise;
  const second = read('token', '', true);
  await replacementStarted.promise;
  expect(request.mock.calls[0][0].options.signal.aborted).toBe(true);
  if (replacementStatus === 'pending') {
    original.reject(new CanceledError());
    await jest.advanceTimersByTimeAsync(0);
    replacement.resolve(response());
  } else {
    if (replacementStatus === 'success') replacement.resolve(response());
    else replacement.reject(unavailable());
    await second;
    // A transport may finish after cancellation; its stale result must be ignored.
    original.resolve(response([{ permission: 'inventory:hosts:write', resourceDefinitions: [] }]));
  }
  const expected = replacementStatus === 'failure' ? [] : permissions;
  await expect(Promise.all([first, second])).resolves.toEqual([expected, expected]);
  await expect(read('token')).resolves.toEqual(expected);
  expect(request).toHaveBeenCalledTimes(2);
});

it('does not return late successful permissions from a previous identity', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  const started = deferred<void>();
  request.mockImplementationOnce(() => {
    started.resolve();
    return pending.promise;
  });
  const first = read('token');
  await started.promise;
  user = makeUser('org-b');
  request.mockResolvedValueOnce(response([]));
  await expect(read('token')).resolves.toEqual([]);
  pending.resolve(response());
  await expect(first).resolves.toEqual([]);
  await expect(read('token')).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(2);
});

it('cannot restore an old identity when getUser resolves after a switch', async () => {
  const oldUser = deferred<ChromeUser>();
  const oldRead = createFetchPermissionsWatcher(() => oldUser.promise)('token');
  user = makeUser('org-b');
  await read('token');
  oldUser.resolve(makeUser());
  await expect(oldRead).resolves.toEqual([]);
  await expect(read('token')).resolves.toEqual(permissions);
  expect(request).toHaveBeenCalledTimes(1);
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

it('honors inventory V2 suppression that becomes active during a request', async () => {
  const pending = deferred<ReturnType<typeof response>>();
  const started = deferred<void>();
  request.mockImplementationOnce(() => {
    started.resolve();
    return pending.promise;
  });
  const first = read('token', 'inventory');
  await started.promise;
  jest.mocked(unleashClientExists).mockReturnValue(true);
  jest.mocked(getUnleashClient).mockReturnValue({ isEnabled: (name: string) => name === 'hbi.rbac-v2' } as ReturnType<typeof getUnleashClient>);
  pending.resolve(response());
  await expect(first).resolves.toEqual([]);
  await expect(read('token', 'inventory')).resolves.toEqual([]);
  expect(request).toHaveBeenCalledTimes(1);
});
