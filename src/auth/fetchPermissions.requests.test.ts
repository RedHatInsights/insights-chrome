import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ChromeUser } from '@redhat-cloud-services/types';

jest.unmock('axios');
jest.mock('../components/FeatureFlags/unleashClient', () => ({ unleashClientExists: () => false }));

// Install the transport before importing the fetcher, whose cached RBAC client
// is created at module initialization. Keep the real generated client and cache.
let transport: MockAdapter;
let createWatcher: typeof import('./fetchPermissions').createFetchPermissionsWatcher;
let read: ReturnType<typeof createWatcher>;
let appNumber = 0;
let app: string;
const firstPermission = { permission: 'inventory:hosts:read' };
const secondPermission = { permission: 'inventory:hosts:write' };
const endpoint = /\/api\/rbac\/v1\/access\//;
const response = (data = [firstPermission], count = data.length) => ({ data, meta: { count } });

beforeAll(() => {
  transport = new MockAdapter(axios, { delayResponse: 5 });
  createWatcher = jest.requireActual('./fetchPermissions').createFetchPermissionsWatcher;
});

beforeEach(() => {
  transport.reset();
  // The production HTTP cache outlives individual permission watchers.
  app = `timeout-test-${appNumber++}`;
  read = createWatcher(() => Promise.resolve({ identity: { org_id: '123' } } as ChromeUser));
});

afterAll(() => transport.restore());

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

it.each(['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK', '503'])('settles concurrent reads after %s and recovers without bypassing cache', async (code) => {
  transport.onGet(endpoint).replyOnce((config: AxiosRequestConfig) => {
    if (code === '503') return [503, {}];
    throw new AxiosError('simulated transport failure', code, config as AxiosError['config']);
  });
  transport.onGet(endpoint).reply(200, response());

  await expect(Promise.all([read('test-token', app), read('test-token', app)])).resolves.toEqual([[], []]);
  expect(transport.history.get).toHaveLength(1);
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
  await expect(read('test-token', app)).resolves.toEqual([firstPermission, secondPermission]);
  expect(transport.history.get.filter(({ url }) => new URL(url!, 'https://test.com').searchParams.get('offset') === '1000')).toHaveLength(2);
});

it('retains a successful empty permissions result', async () => {
  transport.onGet(endpoint).reply(200, response([]));
  await expect(read('test-token', app)).resolves.toEqual([]);
  await expect(read('test-token', app)).resolves.toEqual([]);
  expect(transport.history.get).toHaveLength(1);
});
