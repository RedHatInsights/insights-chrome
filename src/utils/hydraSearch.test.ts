import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import { SearchPermissions, SearchPermissionsCache } from '../state/atoms/localSearchAtom';
import { getUnleashClient, unleashClientExists } from '../components/FeatureFlags/unleashClient';
import { evaluateVisibility } from './isNavItemVisible';
import {
  HYDRA_SEARCH_FILTER,
  HYDRA_SEARCH_MAX_RESULTS,
  HYDRA_SEARCH_OVERRIDE_KEY,
  HYDRA_SEARCH_TIMEOUT_MS,
  HYDRA_SEARCH_URL_OVERRIDE_KEY,
  HydraConsoleDoc,
  HydraSearchError,
  HydraSearchResponse,
  buildHydraQuery,
  buildHydraSearchUrl,
  clearHydraSearchCache,
  escapeSolrTerm,
  getHydraSearchBaseUrl,
  hydraQuery,
  isHydraSearchEnabled,
  mapHydraResponse,
} from './hydraSearch';

jest.mock('../components/FeatureFlags/unleashClient', () => ({
  unleashClientExists: jest.fn(() => false),
  getUnleashClient: jest.fn(),
}));

jest.mock('./isNavItemVisible', () => ({
  evaluateVisibility: jest.fn().mockResolvedValue({ isHidden: false }),
}));

/** Trimmed response captured from access.stage.redhat.com on 2026-11-15 for the query "inven". */
const stageResponse = (): HydraSearchResponse => ({
  response: {
    numFound: 15,
    docs: [
      {
        relative_uri: '/ansible/inventory',
        allTitle: 'Inventory | Ansible',
        abstract: 'View details about your Ansible Automation Platform systems.',
        id: 'hcc-module-/ansible/inventory-ansible.inventory',
        uri: 'console_hcc-module-/ansible/inventory-ansible.inventory',
        bundle_title: ['Ansible'],
        view_uri: 'https://console.stage.redhat.com/ansible/inventory',
      },
      {
        relative_uri: '/subscriptions/inventory',
        allTitle: 'Subscriptions Inventory | ',
        abstract: 'View your purchased subscriptions and explore more information about each one.',
        id: 'hcc-module-/subscriptions/inventory-subscriptions.subscriptionsInventory',
        uri: 'console_hcc-module-/subscriptions/inventory-subscriptions.subscriptionsInventory',
        bundle_title: [''],
        view_uri: 'https://console.stage.redhat.com/subscriptions/inventory',
      },
      {
        relative_uri: 'https://trust.rhcloud.com',
        allTitle: 'Trusted Content | ',
        abstract: 'Trusted content overview',
        id: 'hcc-module-https://trust.rhcloud.com-application-services.trustedContentOverview',
        uri: 'console_hcc-module-https://trust.rhcloud.com-application-services.trustedContentOverview',
        bundle_title: [''],
      },
    ],
  },
  highlighting: {
    'console_hcc-module-/ansible/inventory-ansible.inventory': { allTitle: ['<mark>Inventory</mark> | Ansible'] },
    'console_hcc-module-/subscriptions/inventory-subscriptions.subscriptionsInventory': { allTitle: ['Subscriptions <mark>Inventory</mark> | '] },
  },
});

const doc = (overrides: Partial<HydraConsoleDoc> = {}): HydraConsoleDoc => ({
  id: 'hcc-module-/foo/bar-foo.bar',
  uri: 'console_hcc-module-/foo/bar-foo.bar',
  allTitle: 'Foo Bar | Foo',
  abstract: 'Foo description',
  bundle_title: ['Foo'],
  relative_uri: '/foo/bar',
  ...overrides,
});

const jsonResponse = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
  Promise.resolve({ ok: init.ok ?? true, status: init.status ?? 200, json: () => Promise.resolve(body) } as Response);

/** fetch mock that never resolves on its own and rejects with an AbortError once aborted. */
const hangingFetch = (_url: string, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    if (init?.signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    }
    init?.signal?.addEventListener('abort', () => reject(new DOMException('The operation was aborted.', 'AbortError')));
  });

describe('hydraSearch', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    localStorage.clear();
    clearHydraSearchCache();
    SearchPermissions.clear();
    SearchPermissionsCache.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    (unleashClientExists as jest.Mock).mockReturnValue(false);
    (evaluateVisibility as jest.Mock).mockReset().mockResolvedValue({ isHidden: false });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('isHydraSearchEnabled()', () => {
    it('is disabled when Unleash is not initialized (fail closed)', () => {
      expect(isHydraSearchEnabled()).toBe(false);
    });

    it('follows the Unleash flag', () => {
      const isEnabled = jest.fn(() => true);
      (unleashClientExists as jest.Mock).mockReturnValue(true);
      (getUnleashClient as jest.Mock).mockReturnValue({ isEnabled });
      expect(isHydraSearchEnabled()).toBe(true);
      expect(isEnabled).toHaveBeenCalledWith('platform.chrome.search.hydra');
    });

    it('is disabled when the Unleash client throws', () => {
      (unleashClientExists as jest.Mock).mockReturnValue(true);
      (getUnleashClient as jest.Mock).mockImplementation(() => {
        throw new Error('boom');
      });
      expect(isHydraSearchEnabled()).toBe(false);
    });

    it('lets the localStorage override win over Unleash in both directions', () => {
      (unleashClientExists as jest.Mock).mockReturnValue(true);
      (getUnleashClient as jest.Mock).mockReturnValue({ isEnabled: () => true });
      localStorage.setItem(HYDRA_SEARCH_OVERRIDE_KEY, 'false');
      expect(isHydraSearchEnabled()).toBe(false);

      (getUnleashClient as jest.Mock).mockReturnValue({ isEnabled: () => false });
      localStorage.setItem(HYDRA_SEARCH_OVERRIDE_KEY, 'true');
      expect(isHydraSearchEnabled()).toBe(true);
    });

    it('ignores unknown override values', () => {
      localStorage.setItem(HYDRA_SEARCH_OVERRIDE_KEY, 'yes');
      expect(isHydraSearchEnabled()).toBe(false);
    });
  });

  describe('getHydraSearchBaseUrl()', () => {
    it('targets the stage portal endpoint outside prod', () => {
      expect(getHydraSearchBaseUrl().toString()).toBe('https://access.stage.redhat.com/hydra/rest/search/platform/portal');
    });

    it('accepts an https redhat.com override', () => {
      localStorage.setItem(HYDRA_SEARCH_URL_OVERRIDE_KEY, 'https://access.redhat.com/hydra/rest/search/platform/portal');
      expect(getHydraSearchBaseUrl().hostname).toBe('access.redhat.com');
    });

    it.each(['https://evil.example.com/search', 'https://redhat.com.evil.example.com/search', 'http://access.redhat.com/hydra', 'not a url'])(
      'ignores the unsafe override %s',
      (override) => {
        localStorage.setItem(HYDRA_SEARCH_URL_OVERRIDE_KEY, override);
        expect(getHydraSearchBaseUrl().hostname).toBe('access.stage.redhat.com');
      }
    );
  });

  describe('query building', () => {
    it('escapes Solr special characters', () => {
      expect(escapeSolrTerm('a+b-c:d(e)*?~"/\\')).toBe('a\\+b\\-c\\:d\\(e\\)\\*\\?\\~\\"\\/\\\\');
    });

    it('returns an empty query for blank input', () => {
      expect(buildHydraQuery('   ')).toBe('');
    });

    it('matches every token exactly, as a prefix and fuzzily for longer tokens across boosted fields', () => {
      expect(buildHydraQuery('Inventory  ai')).toBe(
        [
          'allTitle:((inventory OR inventory* OR inventory~1) AND (ai OR ai*))^10',
          'alt_titles:((inventory OR inventory* OR inventory~1) AND (ai OR ai*))^5',
          'abstract:((inventory OR inventory* OR inventory~1) AND (ai OR ai*))^3',
        ].join(' OR ')
      );
    });

    it('neutralizes operators and field syntax typed by the user', () => {
      const query = buildHydraQuery('foo OR id:* NOT');
      expect(query).toContain('(or OR or*)');
      expect(query).toContain('(not OR not*)');
      expect(query).toContain('id\\:\\*');
      expect(query).not.toContain('id:*');
    });

    it('builds the request URL without deprecated client params', () => {
      const url = buildHydraSearchUrl('inventory');
      expect(url.searchParams.get('fq')).toBe(HYDRA_SEARCH_FILTER);
      expect(url.searchParams.get('hl')).toBe('true');
      expect(url.searchParams.get('q')).toBe(buildHydraQuery('inventory'));
      expect(url.searchParams.has('redhat_client')).toBe(false);
      expect(url.searchParams.has('clientName')).toBe(false);
    });
  });

  describe('mapHydraResponse()', () => {
    it('maps the stage response into search items', () => {
      expect(mapHydraResponse('inven', stageResponse())).toEqual([
        {
          id: 'hcc-module-/ansible/inventory-ansible.inventory',
          title: '<mark>Inventory</mark>',
          description: 'View details about your Ansible Automation Platform systems.',
          bundleTitle: 'Ansible',
          pathname: '/ansible/inventory',
        },
        expect.objectContaining({
          id: 'hcc-module-/subscriptions/inventory-subscriptions.subscriptionsInventory',
          title: 'Subscriptions <mark>Inventory</mark>',
          pathname: '/subscriptions/inventory',
          // empty bundle_title falls back to chrome's bundle mapping
          bundleTitle: 'Subscription Services',
        }),
        expect.objectContaining({
          pathname: 'https://trust.rhcloud.com/',
          bundleTitle: 'trust.rhcloud.com',
          isExternal: true,
        }),
      ]);
    });

    it('falls back to client-side highlighting when Solr returns none', () => {
      const [item] = mapHydraResponse('foo', { response: { docs: [doc()] } });
      expect(item.title).toBe('<mark>Foo</mark> Bar');
    });

    it('sanitizes every field rendered as HTML', () => {
      const malicious = doc({
        allTitle: '<img src=x onerror=alert(1)>Foo | Foo',
        abstract: '<script>alert(1)</script>Desc',
        bundle_title: ['<b onclick="x()">Bundle</b>'],
      });
      const [item] = mapHydraResponse('zzz', {
        response: { docs: [malicious] },
        highlighting: {
          [malicious.uri!]: { allTitle: ['<mark onclick="x()">Foo</mark><script>alert(1)</script> | Foo'], abstract: ['<a href="javascript:x()">D</a>'] },
        },
      });
      expect(item.title).toBe('<mark>Foo</mark>');
      expect(item.description).toBe('D');
      expect(item.bundleTitle).toBe('Bundle');
      expect(Object.values(item).join(' ')).not.toMatch(/script|onerror|onclick|javascript/);
    });

    it('drops documents with unsafe or missing links and missing titles', () => {
      const docs = [
        doc({ id: '1', relative_uri: 'javascript:alert(1)' }),
        doc({ id: '2', relative_uri: '//evil.example.com/path' }),
        doc({ id: '3', relative_uri: undefined, view_uri: undefined }),
        doc({ id: '4', allTitle: undefined }),
        doc({ id: '5' }),
      ];
      expect(mapHydraResponse('foo', { response: { docs } }).map(({ id }) => id)).toEqual(['5']);
    });

    it('de-duplicates documents pointing at the same page', () => {
      const docs = [doc({ id: 'a' }), doc({ id: 'b' }), doc({ id: 'c', relative_uri: '/foo/baz' })];
      expect(mapHydraResponse('foo', { response: { docs } }).map(({ id }) => id)).toEqual(['a', 'c']);
    });
  });

  describe('hydraQuery()', () => {
    it('does not call the backend for a blank term', async () => {
      await expect(hydraQuery('  ')).resolves.toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('identifies chrome with X-User-Agent and never sends credentials or an API key', async () => {
      fetchMock.mockReturnValue(jsonResponse(stageResponse()));
      const results = await hydraQuery('inven');
      expect(results).toHaveLength(3);

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url.startsWith('https://access.stage.redhat.com/hydra/rest/search/platform/portal?')).toBe(true);
      expect(init.credentials).toBe('omit');
      const headers = init.headers as Record<string, string>;
      expect(headers['X-User-Agent']).toMatch(/^insights-chrome\//);
      expect(Object.keys(headers).map((h) => h.toLowerCase())).not.toContain('x-api-key');
    });

    it('caches results per term and environment', async () => {
      fetchMock.mockImplementation(() => jsonResponse(stageResponse()));
      await hydraQuery('inven');
      await hydraQuery('inven');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await hydraQuery('inven', { env: ReleaseEnv.PREVIEW });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('caps results at the maximum', async () => {
      const docs = Array.from({ length: 25 }, (_v, i) => doc({ id: `id-${i}`, relative_uri: `/foo/${i}` }));
      fetchMock.mockReturnValue(jsonResponse({ response: { docs } }));
      await expect(hydraQuery('foo')).resolves.toHaveLength(HYDRA_SEARCH_MAX_RESULTS);
    });

    it('hides results whose local nav permissions are not met', async () => {
      const permissions = [{ method: 'isOrgAdmin' }];
      SearchPermissions.set('hcc-module-/ansible/inventory-ansible.inventory', permissions as never);
      (evaluateVisibility as jest.Mock).mockImplementation(async ({ permissions }) => ({ isHidden: !!permissions }));
      fetchMock.mockReturnValue(jsonResponse(stageResponse()));

      const results = await hydraQuery('inven');
      expect(results.map(({ id }) => id)).not.toContain('hcc-module-/ansible/inventory-ansible.inventory');
      expect(results).toHaveLength(2);
      expect(evaluateVisibility).toHaveBeenCalledWith(
        { id: 'hcc-module-/ansible/inventory-ansible.inventory', permissions },
        expect.objectContaining({ source: 'search' })
      );
    });

    it('does not cache results affected by a visibility failure', async () => {
      SearchPermissions.set('hcc-module-/ansible/inventory-ansible.inventory', [{ method: 'isOrgAdmin' }] as never);
      (evaluateVisibility as jest.Mock).mockImplementationOnce(async (_item, { onError }) => {
        onError();
        return { isHidden: true };
      });
      fetchMock.mockImplementation(() => jsonResponse(stageResponse()));

      await expect(hydraQuery('inven')).resolves.toHaveLength(2);
      await expect(hydraQuery('inven')).resolves.toHaveLength(3);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['an HTTP error', () => jsonResponse('Invalid search path', { ok: false, status: 400 }), 'http'],
      ['an unexpected payload', () => jsonResponse({ docs: [] }), 'invalid-response'],
      ['a non-JSON payload', () => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('bad')) }), 'invalid-response'],
      ['a network error', () => Promise.reject(new TypeError('Failed to fetch')), 'network'],
    ])('throws a HydraSearchError on %s', async (_name, response, reason) => {
      fetchMock.mockImplementation(response);
      const error = await hydraQuery('foo').catch((e) => e);
      expect(error).toBeInstanceOf(HydraSearchError);
      expect(error.reason).toBe(reason);
    });

    it('times out slow requests', async () => {
      jest.useFakeTimers();
      fetchMock.mockImplementation(hangingFetch);
      const pending = hydraQuery('foo').catch((e) => e);
      jest.advanceTimersByTime(HYDRA_SEARCH_TIMEOUT_MS);
      const error = await pending;
      expect(error).toBeInstanceOf(HydraSearchError);
      expect(error.reason).toBe('timeout');
    });

    it('rethrows caller aborts as-is so they are not treated as backend failures', async () => {
      fetchMock.mockImplementation(hangingFetch);
      const controller = new AbortController();
      const pending = hydraQuery('foo', { signal: controller.signal }).catch((e) => e);
      controller.abort();
      const error = await pending;
      expect(error).not.toBeInstanceOf(HydraSearchError);
      expect(error.name).toBe('AbortError');
    });

    it('aborts immediately when given an already aborted signal', async () => {
      fetchMock.mockImplementation(hangingFetch);
      const controller = new AbortController();
      controller.abort();
      const error = await hydraQuery('foo', { signal: controller.signal }).catch((e) => e);
      expect(error.name).toBe('AbortError');
    });
  });
});
