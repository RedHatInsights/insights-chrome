import axios, { AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ChromeUser } from '@redhat-cloud-services/types';
import { getVisibilityFunctions, initializeVisibilityFunctions } from './VisibilitySingleton';
import { VISIBILITY_REQUEST_TIMEOUT_MS } from './visibilityRequestConfig';

jest.unmock('axios');
jest.mock('./common', () => ({ ITLess: () => false, isProd: () => true }));
jest.mock('../components/FeatureFlags/unleashClient', () => ({
  getUnleashClient: jest.fn(() => ({ isEnabled: (name: string) => name === 'platform.chrome.kessel' })),
  getFeatureFlagsError: jest.fn(() => false),
}));
jest.mock('@scalprum/core', () => ({ initSharedScope: jest.fn(), getSharedScope: jest.fn().mockReturnValue({}) }));

const transport = new MockAdapter(axios);
const user = { identity: { org_id: '123' } } as ChromeUser;
const getToken = jest.fn(() => Promise.resolve('current-token'));
let visibility: ReturnType<typeof getVisibilityFunctions>;

beforeEach(() => {
  transport.reset();
  getToken.mockClear();
  initializeVisibilityFunctions({
    getUser: () => Promise.resolve(user),
    getToken,
    getUserPermissions: () => Promise.resolve([]),
    isPreview: false,
  });
  visibility = getVisibilityFunctions();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());
afterAll(() => transport.restore());

const errors = ['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK'];
const kesselChecks = [
  { endpoint: 'checkself', relations: ['rbac_roles_read'], success: { allowed: 'ALLOWED_TRUE' } },
  {
    endpoint: 'checkselfbulk',
    relations: ['rbac_roles_read', 'rbac_groups_read'],
    success: { pairs: [{ item: { allowed: 'ALLOWED_FALSE' } }, { item: { allowed: 'ALLOWED_TRUE' } }] },
  },
];

describe.each(kesselChecks)('Kessel $endpoint', ({ endpoint, relations, success }) => {
  it.each(errors)('fails closed on %s and recovers on the next request', async (code) => {
    const url = `/api/kessel/v1beta2/${endpoint}`;
    transport.onPost(url).replyOnce((config) => {
      throw new AxiosError('transport failure', code, config as AxiosError['config']);
    });
    transport.onPost(url).reply(200, success);

    await expect(visibility.loosePermissionsKessel(relations)).resolves.toBe(false);
    expect(transport.history.post).toHaveLength(1);
    await expect(visibility.loosePermissionsKessel(relations)).resolves.toBe(true);
    expect(transport.history.post).toHaveLength(2);
    transport.history.post.forEach((config) => expect(config.timeout).toBe(VISIBILITY_REQUEST_TIMEOUT_MS));
  });
});

describe('apiRequest', () => {
  const relativeUrl = '/api/content-sources/v1.0/features/';

  it.each(errors)('returns false on %s without running the matcher and recovers with the same callbacks', async (code) => {
    transport.onGet(relativeUrl).replyOnce((config) => {
      throw new AxiosError('transport failure', code, config as AxiosError['config']);
    });
    transport.onGet(relativeUrl).reply(200, { features: [] });
    const options = { url: relativeUrl, accessor: 'features', matcher: 'isEmpty' };
    await expect(visibility.apiRequest(options)).resolves.toBe(false);
    expect(transport.history.get).toHaveLength(1);
    await expect(visibility.apiRequest(options)).resolves.toBe(true);
    expect(transport.history.get).toHaveLength(2);
    expect(getToken).toHaveBeenCalledTimes(2);
  });

  it.each([relativeUrl, 'https://example.test/custom?existing=value'])('preserves request and authentication options for %s', async (url) => {
    const controller = new AbortController();
    transport.onPost(url).reply(200, { lightwell: { accessible: true } });
    const options = {
      url,
      method: 'POST',
      data: { query: 'unchanged' },
      params: { filter: 'unchanged' },
      headers: { 'X-Custom': 'unchanged' },
      signal: controller.signal,
      accessor: 'lightwell.accessible',
    };
    await expect(visibility.apiRequest(options)).resolves.toBe(true);
    const request = transport.history.post[0];
    expect(request).toMatchObject({ url, params: options.params, signal: controller.signal, timeout: VISIBILITY_REQUEST_TIMEOUT_MS });
    expect(JSON.parse(request.data)).toEqual(options.data);
    expect(request.headers).toMatchObject({ Authorization: 'Bearer current-token', 'X-Custom': 'unchanged' });
  });

  it('preserves an explicit Authorization header and reads a fresh token for later calls', async () => {
    transport.onGet(relativeUrl).reply(200, { lightwell: { accessible: true } });
    await visibility.apiRequest({ url: relativeUrl, headers: { Authorization: 'custom-auth' } });
    getToken.mockResolvedValueOnce('renewed-token');
    await visibility.apiRequest({ url: relativeUrl });
    expect(transport.history.get[0].headers?.Authorization).toBe('custom-auth');
    expect(transport.history.get[1].headers?.Authorization).toBe('Bearer renewed-token');
  });

  it.each([
    [0, VISIBILITY_REQUEST_TIMEOUT_MS],
    [60_000, VISIBILITY_REQUEST_TIMEOUT_MS],
    [100, 100],
  ])('bounds timeout=%s after spreading caller options', async (timeout, expected) => {
    transport.onGet(relativeUrl).reply(200, { data: [] });
    await visibility.apiRequest({ url: relativeUrl, timeout });
    expect(transport.history.get[0].timeout).toBe(expected);
  });
});
