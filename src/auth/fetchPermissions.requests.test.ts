import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ChromeUser } from '@redhat-cloud-services/types';

jest.unmock('axios');
jest.mock('../components/FeatureFlags/unleashClient', () => ({ unleashClientExists: () => false }));

// Keep the real generated client and HTTP cache; only replace the transport.
let transport: MockAdapter;
let createWatcher: typeof import('./fetchPermissions').createFetchPermissionsWatcher;
let resetCache: typeof import('./fetchPermissions').resetPermissionCache;
let failureTtl: number;
let invalidateFailures: typeof import('./fetchPermissions').invalidatePermissionFailures;
let read: ReturnType<typeof createWatcher>;
let appNumber = 0;
let app: string;
let now: number;
const firstPermission = { permission: 'inventory:hosts:read' };
const secondPermission = { permission: 'inventory:hosts:write' };
const endpoint = /\/api\/rbac\/v1\/access\//;
const response = (data = [firstPermission], count = data.length) => ({ data, meta: { count } });

beforeAll(() => {
  transport = new MockAdapter(axios, { delayResponse: 5 });
  createWatcher = jest.requireActual('./fetchPermissions').createFetchPermissionsWatcher;
  resetCache = jest.requireActual('./fetchPermissions').resetPermissionCache;
  failureTtl = jest.requireActual('./fetchPermissions').RBAC_FAILURE_CACHE_TTL_MS;
  invalidateFailures = jest.requireActual('./fetchPermissions').invalidatePermissionFailures;
});

beforeEach(() => {
  transport.reset();
  transport.delayResponse = 5;
  resetCache();
  now = Date.now();
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  app = `timeout-test-${appNumber++}`;
  read = createWatcher(() => Promise.resolve({ identity: { org_id: '123' } } as ChromeUser));
});

afterAll(() => transport.restore());
afterEach(() => jest.restoreAllMocks());

it('bounds every page and preserves successful permission caching', async () => {
  transport.onGet(endpoint).reply((config) => {
    const offset = Number(new URL(config.url!, 'https://test.com').searchParams.get('offset') || 0);
    return [200, response(offset === 0 ? [firstPermission] : offset === 1000 ? [secondPermission] : [], 1001)];
  });

  await expect(read('test-token', app)).resolves.toEqual([firstPermission, secondPermission]);
  expect(transport.history.get.length).toBeGreaterThan(1);
  transport.history.get.forEach((config) => expect(config.timeout).toBe(5_000));
  const requests = transport.history.get.length;
  await expect(read('test-token', app)).resolves.toEqual([firstPermission, secondPermission]);
  expect(transport.history.get).toHaveLength(requests);
});

it.each(['ECONNABORTED', '503'])('settles concurrent reads after %s and recovers without bypassing cache', async (code) => {
  transport.onGet(endpoint).replyOnce((config: AxiosRequestConfig) => {
    if (code === '503') return [503, {}];
    throw new AxiosError('simulated transport failure', code, config as AxiosError['config']);
  });
  transport.onGet(endpoint).reply(200, response());

  await expect(Promise.all([read('test-token', app), read('test-token', app)])).resolves.toEqual([[], []]);
  expect(transport.history.get).toHaveLength(1);
  now += failureTtl - 1;
  await expect(read('test-token', app)).resolves.toEqual([]);
  expect(transport.history.get).toHaveLength(1);
  now++;
  await expect(read('test-token', app)).resolves.toEqual([firstPermission]);
  expect(transport.history.get).toHaveLength(2);
  await expect(read('test-token', app)).resolves.toEqual([firstPermission]);
  expect(transport.history.get).toHaveLength(2);
});

it('discards partial permissions on a later-page timeout and retries the failed page', async () => {
  let fail = true;
  transport.onGet(endpoint).reply((config) => {
    const offset = Number(new URL(config.url!, 'https://test.com').searchParams.get('offset') || 0);
    if (offset === 1000 && fail) {
      fail = false;
      throw new AxiosError('simulated page timeout', 'ECONNABORTED', config as AxiosError['config']);
    }
    return [200, response(offset === 0 ? [firstPermission] : offset === 1000 ? [secondPermission] : [], 1001)];
  });

  await expect(read('test-token', app)).resolves.toEqual([]);
  await expect(read('test-token', app)).resolves.toEqual([]);
  expect(transport.history.get.filter(({ url }) => new URL(url!, 'https://test.com').searchParams.get('offset') === '1000')).toHaveLength(1);
  now += failureTtl;
  await expect(read('test-token', app)).resolves.toEqual([firstPermission, secondPermission]);
  expect(transport.history.get.filter(({ url }) => new URL(url!, 'https://test.com').searchParams.get('offset') === '1000')).toHaveLength(2);
  expect(transport.history.get.filter(({ url }) => !new URL(url!, 'https://test.com').searchParams.has('offset'))).toHaveLength(1);
});

it('retains a successful empty permissions result', async () => {
  transport.onGet(endpoint).reply(200, response([]));
  await expect(read('test-token', app)).resolves.toEqual([]);
  await expect(read('test-token', app)).resolves.toEqual([]);
  expect(transport.history.get).toHaveLength(1);
});

it('bypasses successful HTTP pages for one application without evicting another', async () => {
  transport.onGet(endpoint).reply(200, response());
  await read('test-token', app);
  await read('test-token', 'another-app');
  transport.onGet(endpoint).reply(200, response([secondPermission]));
  await expect(read('test-token', app, true)).resolves.toEqual([secondPermission]);
  await expect(read('test-token', 'another-app')).resolves.toEqual([firstPermission]);
  expect(transport.history.get).toHaveLength(3);
});

it('lets a pre-bypass request finish without overwriting the refreshed permissions', async () => {
  let finish!: (value: [number, ReturnType<typeof response>]) => void;
  let notifyStarted!: () => void;
  const started = new Promise<void>((resolve) => (notifyStarted = resolve));
  transport.onGet(endpoint).replyOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
        notifyStarted();
      })
  );
  transport.onGet(endpoint).reply(200, response([secondPermission]));
  const first = read('test-token', app);
  await started;
  await expect(read('test-token', app, true)).resolves.toEqual([secondPermission]);
  expect(transport.history.get[0].signal?.aborted).not.toBe(true);
  finish([200, response()]);
  await expect(first).resolves.toEqual([firstPermission]);
  await expect(read('test-token', app)).resolves.toEqual([secondPermission]);
  expect(transport.history.get).toHaveLength(2);
});

it('shares failures across navigation and public API watchers and bypasses the TTL', async () => {
  const getUser = async () => ({ identity: { org_id: '123', internal: { account_id: 'user-a' } } }) as ChromeUser;
  const navigationRead = createWatcher(getUser);
  const publicRead = createWatcher(getUser);
  transport.onGet(endpoint).replyOnce(503);
  transport.onGet(endpoint).reply(200, response());
  await expect(navigationRead('test-token', app)).resolves.toEqual([]);
  await expect(publicRead('test-token', app)).resolves.toEqual([]);
  expect(transport.history.get).toHaveLength(1);
  await expect(publicRead('test-token', app, true)).resolves.toEqual([firstPermission]);
  await expect(navigationRead('test-token', app)).resolves.toEqual([firstPermission]);
  expect(transport.history.get).toHaveLength(2);
});

it('does not reuse successful HTTP data in existing or new watchers after reset', async () => {
  transport.onGet(endpoint).reply(200, response());
  await read('test-token', app);
  resetCache();
  transport.onGet(endpoint).reply(200, response([secondPermission]));
  const other = createWatcher(async () => ({ identity: { org_id: '123' } }) as ChromeUser);
  await expect(read('test-token', app)).resolves.toEqual([secondPermission]);
  await expect(other('test-token', app)).resolves.toEqual([secondPermission]);
  expect(transport.history.get).toHaveLength(2);
});

it('coalesces ordinary concurrent reads across watchers through the HTTP cache', async () => {
  transport.onGet(endpoint).reply(200, response());
  const other = createWatcher(async () => ({ identity: { org_id: '123' } }) as ChromeUser);
  await expect(Promise.all([read('token', app), other('token', app), read('token', app)])).resolves.toEqual([
    [firstPermission],
    [firstPermission],
    [firstPermission],
  ]);
  expect(transport.history.get).toHaveLength(1);
});

it('coalesces overlapping bypass reads after the first transport has started', async () => {
  transport.delayResponse = 0;
  let finish!: (value: [number, ReturnType<typeof response>]) => void;
  let notifyStarted!: () => void;
  const started = new Promise<void>((resolve) => (notifyStarted = resolve));
  transport.onGet(endpoint).replyOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
        notifyStarted();
      })
  );
  transport.onGet(endpoint).reply(200, response([secondPermission]));
  const requests = [read('token', app, true)];
  await started;
  const other = createWatcher(async () => ({ identity: { org_id: '123' } }) as ChromeUser);
  for (let index = 0; index < 4; index++) {
    requests.push(other('token', app, true));
    // Yield an event-loop turn so each caller reaches Axios while the first
    // transport is pending; a same-microtask burst misses the regression.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  requests.push(read('token', app));
  expect(transport.history.get).toHaveLength(1);
  expect(transport.history.get[0].signal?.aborted).not.toBe(true);
  finish([200, response()]);
  await expect(Promise.all(requests)).resolves.toEqual(Array(6).fill([firstPermission]));
  expect(transport.history.get).toHaveLength(1);
  // A subsequent, non-overlapping bypass still forces fresh data.
  await expect(read('token', app, true)).resolves.toEqual([secondPermission]);
  expect(transport.history.get).toHaveLength(2);
});

it.each([{ initial: [] }, { initial: [firstPermission] }])(
  'lets a new watcher refresh successful permissions after the HTTP TTL (initial: $initial)',
  async ({ initial }) => {
    const HTTP_TTL_MS = 60_000;
    transport.onGet(endpoint).reply(200, response(initial), { 'cache-control': 'max-age=60' });
    await expect(read('token', app)).resolves.toEqual(initial);
    transport.onGet(endpoint).reply(200, response([secondPermission]));
    const newWatcher = () => createWatcher(async () => ({ identity: { org_id: '123' } }) as ChromeUser);
    now += HTTP_TTL_MS - 1;
    invalidateFailures();
    await expect(newWatcher()('renewed-token', app)).resolves.toEqual(initial);
    expect(transport.history.get).toHaveLength(1);
    now += 2;
    invalidateFailures();
    await expect(newWatcher()('renewed-again', app)).resolves.toEqual([secondPermission]);
    expect(transport.history.get).toHaveLength(2);
    // Existing watchers retain their original successful cache, as before.
    await expect(read('renewed-again', app)).resolves.toEqual(initial);
  }
);

it('isolates HTTP responses from work started before a reset', async () => {
  let finish!: (value: [number, ReturnType<typeof response>]) => void;
  let notifyStarted!: () => void;
  const started = new Promise<void>((resolve) => (notifyStarted = resolve));
  transport.onGet(endpoint).replyOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
        notifyStarted();
      })
  );
  transport.onGet(endpoint).reply(200, response([secondPermission]));
  const first = read('token', app);
  await started;
  resetCache();
  await expect(read('token', app)).resolves.toEqual([secondPermission]);
  finish([200, response()]);
  await expect(first).resolves.toEqual([]);
  const other = createWatcher(async () => ({ identity: { org_id: '123' } }) as ChromeUser);
  await expect(other('token', app)).resolves.toEqual([secondPermission]);
  expect(transport.history.get).toHaveLength(2);
});
