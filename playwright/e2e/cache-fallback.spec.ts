import type { Page } from '@playwright/test';
import { expect, test } from '../setup/test-setup';
import { CONFIG_SOURCES, type ConfigSource } from '../../src/utils/configCacheStatus';

type CacheEntry = {
  key: string;
  data: unknown;
};

type ConfigMode = 'cache' | 'live';
type StaticConfigMode = 'serviceTiles' | 'searchIndex';
type NavigationResponse = 'failure' | 'malformed' | 'live';
type ConfigRouteModes = {
  sso: ConfigMode;
  fedModules: ConfigMode;
  navigation: NavigationResponse;
  serviceTiles?: ConfigMode;
  searchIndex?: ConfigMode;
  cacheFallbackEnabled?: boolean;
};
type RouteObservations = {
  cached: Set<ConfigSource>;
  cacheWarnings: Set<ConfigSource>;
  live: Set<ConfigSource>;
  malformed: Set<ConfigSource>;
};

const CACHE_DATABASE = 'chrome-config-cache';
const CACHE_STORE = 'keyvaluepairs';
const CACHE_SCHEMA_VERSION = 1;
const E2E_TIMEOUT = 60_000;
const FOCUSED_CACHE_SOURCE_COUNT = 1;
const FOCUSED_LIVE_SOURCE_COUNT = 2;
const CORE_CONFIG_SOURCE_COUNT = 3;
const SSO_CONFIG_SOURCE = CONFIG_SOURCES.SSO_CONFIG;
const FED_MODULES_SOURCE = CONFIG_SOURCES.FED_MODULES;
const NAVIGATION_SOURCE = CONFIG_SOURCES.NAVIGATION;
const SERVICE_TILES_SOURCE = CONFIG_SOURCES.SERVICE_TILES;
const SEARCH_INDEX_SOURCE = CONFIG_SOURCES.SEARCH_INDEX;
const CACHE_WARNING_BY_SOURCE: Record<ConfigSource, string> = {
  [SSO_CONFIG_SOURCE]: '[chrome] SSO config loaded from IndexedDB cache (origin unavailable)',
  [FED_MODULES_SOURCE]: '[chrome] Fed modules loaded from IndexedDB cache (origin unavailable)',
  [NAVIGATION_SOURCE]: '[chrome] Bundle navigation loaded from IndexedDB cache (origin unavailable)',
  [SERVICE_TILES_SOURCE]: '[chrome] Service tiles loaded from IndexedDB cache (origin unavailable)',
  [SEARCH_INDEX_SOURCE]: '[chrome] Search index loaded from IndexedDB cache (origin unavailable)',
};
const EXPECTED_CACHE_WARNING_SOURCES: ConfigSource[] = [SSO_CONFIG_SOURCE, FED_MODULES_SOURCE, NAVIGATION_SOURCE];
const TEST_NAVIGATION_PATH = '/insights/cached-navigation-check';
const CACHED_SERVICE_TITLE = 'Cached Test Service';
const LIVE_SERVICE_TITLE = 'Live-only Service';

const cachedSSOConfig = {
  ssoUrl: 'https://sso.stage.redhat.com/auth/',
  ssoMapping: { 'stage.foo.redhat.com': 'https://sso.stage.redhat.com/auth/' },
};

const cachedFedModules = {
  chrome: {
    manifestLocation: '/apps/chrome/fed-mods.json',
    modules: [],
  },
};

const cachedNavigation = [
  {
    id: 'insights',
    title: 'Insights',
    navItems: [
      {
        id: 'cached-test-service',
        title: CACHED_SERVICE_TITLE,
        href: '/cached-test-service',
      },
    ],
  },
];

const cachedServiceTiles = [
  {
    title: 'Cached Services',
    links: [{ title: 'Cached Service', href: '/cached-service' }],
  },
];

const cachedSearchIndex = [{ id: 'cached-search-entry', title: 'Cached Search Entry', href: '/cached-search' }];

const malformedNavigation = [
  {
    id: 'insights',
    title: 'Partial Live Navigation',
    navItems: [
      {
        id: 'live-only-service',
        title: LIVE_SERVICE_TITLE,
        href: '/live-only-service',
      },
    ],
  },
  null,
];

const featureFlags = (cacheFallbackEnabled = true) => ({
  toggles: [
    {
      name: 'platform.chrome.consume-feo',
      enabled: true,
      impressionData: false,
      variant: { name: 'disabled', enabled: false },
    },
    {
      name: 'platform.chrome.config-cache-fallback',
      enabled: cacheFallbackEnabled,
      impressionData: false,
      variant: { name: cacheFallbackEnabled ? 'enabled' : 'disabled', enabled: cacheFallbackEnabled },
    },
    {
      name: 'platform.chrome.degraded-state-banner',
      enabled: true,
      impressionData: false,
      variant: { name: 'disabled', enabled: false },
    },
  ],
});

const cacheKey = (key: string) => `v${CACHE_SCHEMA_VERSION}:${key}`;

async function seedConfigCache(page: Page, entries: CacheEntry[]) {
  await page.goto('/apps/chrome/js/silent-check-sso.html');
  await page.evaluate(
    ({ database, storeName, entries }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(database);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(storeName)) {
            request.result.createObjectStore(storeName);
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          store.clear();
          const cachedAt = Date.now();
          entries.forEach(({ key, data }) => store.put({ data, cachedAt }, key));
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    { database: CACHE_DATABASE, storeName: CACHE_STORE, entries }
  );
}

async function readCacheEntry(page: Page, key: string) {
  return page.evaluate(
    ({ database, storeName, key }) =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open(database);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const readRequest = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
          readRequest.onsuccess = () => {
            db.close();
            resolve(readRequest.result);
          };
          readRequest.onerror = () => reject(readRequest.error);
        };
      }),
    { database: CACHE_DATABASE, storeName: CACHE_STORE, key }
  );
}

async function setupConfigRoutes(page: Page, modes: ConfigRouteModes): Promise<RouteObservations> {
  const observations: RouteObservations = {
    cached: new Set(),
    cacheWarnings: new Set(),
    live: new Set(),
    malformed: new Set(),
  };
  page.on('console', (message) => {
    if (message.type() !== 'warning') {
      return;
    }
    for (const [source, warning] of Object.entries(CACHE_WARNING_BY_SOURCE) as [ConfigSource, string][]) {
      if (message.text() === warning) {
        observations.cacheWarnings.add(source);
      }
    }
  });

  await page.route('**/api/featureflags/v0**', (route) => route.fulfill({ json: featureFlags(modes.cacheFallbackEnabled ?? true) }));
  await page.route('**/apps/chrome/operator-generated/fed-modules.json*', (route) => route.fulfill({ json: {} }));

  await page.route('**/api/chrome-service/v1/static/service-tiles-generated.json*', async (route) => {
    if (modes.serviceTiles === 'cache') {
      observations.cached.add(SERVICE_TILES_SOURCE);
      await route.abort();
      return;
    }
    await route.fulfill({ json: cachedServiceTiles });
  });

  await page.route('**/api/chrome-service/v1/static/search-index-generated.json*', async (route) => {
    if (modes.searchIndex === 'cache') {
      observations.cached.add(SEARCH_INDEX_SOURCE);
      await route.abort();
      return;
    }
    await route.fulfill({ json: cachedSearchIndex });
  });

  await page.route('**/api/chrome-service/v1/static/sso-config-generated.json*', async (route) => {
    if (modes.sso === 'cache') {
      observations.cached.add(SSO_CONFIG_SOURCE);
      await route.abort();
      return;
    }
    observations.live.add(SSO_CONFIG_SOURCE);
    await route.fulfill({ json: cachedSSOConfig });
  });

  await page.route('**/api/chrome-service/v1/static/fed-modules-generated.json*', async (route) => {
    if (modes.fedModules === 'cache') {
      observations.cached.add(FED_MODULES_SOURCE);
      await route.abort();
      return;
    }
    observations.live.add(FED_MODULES_SOURCE);
    await route.fulfill({ json: cachedFedModules });
  });

  await page.route('**/config/chrome/fed-modules.json*', async (route) => {
    if (modes.fedModules === 'cache') {
      await route.abort();
      return;
    }
    await route.fulfill({ json: cachedFedModules });
  });

  await page.route('**/api/chrome-service/v1/static/bundles-generated.json*', async (route) => {
    if (modes.navigation === 'failure') {
      observations.cached.add(NAVIGATION_SOURCE);
      await route.abort();
      return;
    }
    if (modes.navigation === 'malformed') {
      observations.malformed.add(NAVIGATION_SOURCE);
      await route.fulfill({ status: 200, json: malformedNavigation });
      return;
    }
    observations.live.add(NAVIGATION_SOURCE);
    await route.fulfill({ json: cachedNavigation });
  });

  return observations;
}

const focusedCacheScenarios: Array<{ name: string; source: ConfigSource; data: unknown }> = [
  {
    name: 'reports cached SSO degradation when federated modules and navigation are live',
    source: SSO_CONFIG_SOURCE,
    data: cachedSSOConfig,
  },
  {
    name: 'reports cached federated-module degradation when SSO and navigation are live',
    source: FED_MODULES_SOURCE,
    data: cachedFedModules,
  },
  {
    name: 'reports cached navigation degradation when SSO and federated modules are live',
    source: NAVIGATION_SOURCE,
    data: cachedNavigation,
  },
];

const focusedStaticCacheScenarios: Array<{ name: string; source: ConfigSource; data: unknown; mode: StaticConfigMode }> = [
  {
    name: 'reports cached service-tile degradation when core config is live',
    source: SERVICE_TILES_SOURCE,
    data: cachedServiceTiles,
    mode: 'serviceTiles',
  },
  {
    name: 'reports cached search-index degradation when core config is live',
    source: SEARCH_INDEX_SOURCE,
    data: cachedSearchIndex,
    mode: 'searchIndex',
  },
];

test.describe('IndexedDB config cache fallback', () => {
  for (const scenario of focusedCacheScenarios) {
    test(scenario.name, async ({ page }) => {
      await seedConfigCache(page, [{ key: cacheKey(scenario.source), data: scenario.data }]);
      const observations = await setupConfigRoutes(page, {
        sso: scenario.source === SSO_CONFIG_SOURCE ? 'cache' : 'live',
        fedModules: scenario.source === FED_MODULES_SOURCE ? 'cache' : 'live',
        navigation: scenario.source === NAVIGATION_SOURCE ? 'failure' : 'live',
      });

      await page.goto(TEST_NAVIGATION_PATH);

      const degradedBanner = page.locator('[data-ouia-component-id="DegradedStateBanner"]');
      await expect(degradedBanner).toBeVisible({ timeout: E2E_TIMEOUT });
      await expect(degradedBanner).toContainText('Core functionality is available');
      await expect(degradedBanner).toContainText('Navigation Configuration');
      await expect(page.getByRole('link', { name: CACHED_SERVICE_TITLE })).toBeVisible({ timeout: E2E_TIMEOUT });
      await expect.poll(() => observations.cached.size, { timeout: E2E_TIMEOUT }).toBe(FOCUSED_CACHE_SOURCE_COUNT);
      await expect.poll(() => observations.live.size, { timeout: E2E_TIMEOUT }).toBe(FOCUSED_LIVE_SOURCE_COUNT);
      expect([...observations.cached]).toEqual([scenario.source]);
    });
  }

  for (const scenario of focusedStaticCacheScenarios) {
    test(scenario.name, async ({ page }) => {
      await seedConfigCache(page, [{ key: cacheKey(scenario.source), data: scenario.data }]);
      const observations = await setupConfigRoutes(page, {
        sso: 'live',
        fedModules: 'live',
        navigation: 'live',
        serviceTiles: scenario.mode === 'serviceTiles' ? 'cache' : 'live',
        searchIndex: scenario.mode === 'searchIndex' ? 'cache' : 'live',
      });

      await page.goto(TEST_NAVIGATION_PATH);

      const degradedBanner = page.locator('[data-ouia-component-id="DegradedStateBanner"]');
      await expect(degradedBanner).toBeVisible({ timeout: E2E_TIMEOUT });
      await expect(degradedBanner).toContainText('Core functionality is available');
      await expect(degradedBanner).toContainText('Navigation Configuration');
      await expect.poll(() => observations.cached.size, { timeout: E2E_TIMEOUT }).toBe(FOCUSED_CACHE_SOURCE_COUNT);
      await expect.poll(() => observations.live.size, { timeout: E2E_TIMEOUT }).toBe(CORE_CONFIG_SOURCE_COUNT);
      await expect.poll(() => observations.cacheWarnings.size, { timeout: E2E_TIMEOUT }).toBe(FOCUSED_CACHE_SOURCE_COUNT);
      expect([...observations.cached]).toEqual([scenario.source]);
      expect([...observations.cacheWarnings]).toEqual([scenario.source]);
    });
  }

  test('does not read post-auth cache when the dedicated flag is disabled', async ({ page }) => {
    await seedConfigCache(page, [{ key: cacheKey(SERVICE_TILES_SOURCE), data: cachedServiceTiles }]);
    const observations = await setupConfigRoutes(page, {
      sso: 'live',
      fedModules: 'live',
      navigation: 'live',
      serviceTiles: 'cache',
      cacheFallbackEnabled: false,
    });

    await page.goto('/allservices');

    await expect.poll(() => observations.cached.size, { timeout: E2E_TIMEOUT }).toBe(FOCUSED_CACHE_SOURCE_COUNT);
    await expect.poll(() => observations.cacheWarnings.size, { timeout: E2E_TIMEOUT }).toBe(0);
    await expect(page.getByRole('link', { name: 'Cached Service' })).toHaveCount(0);
    expect(await readCacheEntry(page, cacheKey(SERVICE_TILES_SOURCE))).toMatchObject({ data: cachedServiceTiles });
  });

  test('persists live config and uses it after a later origin failure', async ({ page }) => {
    const modes: ConfigRouteModes = {
      sso: 'live',
      fedModules: 'live',
      navigation: 'live',
    };
    const liveConfigEntries: CacheEntry[] = [
      { key: cacheKey(SSO_CONFIG_SOURCE), data: cachedSSOConfig },
      { key: cacheKey(FED_MODULES_SOURCE), data: cachedFedModules },
      { key: cacheKey(NAVIGATION_SOURCE), data: cachedNavigation },
    ];
    await seedConfigCache(page, []);
    const observations = await setupConfigRoutes(page, modes);

    await page.goto(TEST_NAVIGATION_PATH);

    const degradedBanner = page.locator('[data-ouia-component-id="DegradedStateBanner"]');
    await expect(page.getByRole('link', { name: CACHED_SERVICE_TITLE })).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect.poll(() => observations.live.size, { timeout: E2E_TIMEOUT }).toBe(CORE_CONFIG_SOURCE_COUNT);

    for (const entry of liveConfigEntries) {
      await expect.poll(() => readCacheEntry(page, entry.key), { timeout: E2E_TIMEOUT }).toMatchObject({ data: entry.data, cachedAt: expect.any(Number) });
    }
    const persistedEnvelopes = await Promise.all(liveConfigEntries.map(({ key }) => readCacheEntry(page, key)));
    await expect(degradedBanner).toBeHidden({ timeout: E2E_TIMEOUT });

    modes.sso = 'cache';
    modes.fedModules = 'cache';
    modes.navigation = 'failure';
    await page.reload();

    await expect(degradedBanner).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(page.getByRole('link', { name: CACHED_SERVICE_TITLE })).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect.poll(() => observations.cached.size, { timeout: E2E_TIMEOUT }).toBe(CORE_CONFIG_SOURCE_COUNT);
    await expect.poll(() => observations.cacheWarnings.size, { timeout: E2E_TIMEOUT }).toBe(CORE_CONFIG_SOURCE_COUNT);
    expect([...observations.cacheWarnings].sort()).toEqual([...EXPECTED_CACHE_WARNING_SOURCES].sort());
    for (const [index, entry] of liveConfigEntries.entries()) {
      const cachedEnvelope = await readCacheEntry(page, entry.key);
      expect(cachedEnvelope).toEqual(persistedEnvelopes[index]);
      expect(cachedEnvelope).toMatchObject({ data: entry.data, cachedAt: expect.any(Number) });
    }
  });

  test('preserves cached navigation across malformed data and verifies a fresh live startup', async ({ page }) => {
    const modes: ConfigRouteModes = {
      sso: 'live',
      fedModules: 'live',
      navigation: 'malformed',
    };
    const observations = await setupConfigRoutes(page, modes);

    await seedConfigCache(page, [{ key: cacheKey(NAVIGATION_SOURCE), data: cachedNavigation }]);
    await page.goto(TEST_NAVIGATION_PATH);

    await expect(page.getByRole('link', { name: LIVE_SERVICE_TITLE })).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(page.getByRole('link', { name: CACHED_SERVICE_TITLE })).toHaveCount(0);
    await expect.poll(() => observations.malformed.size, { timeout: E2E_TIMEOUT }).toBe(FOCUSED_CACHE_SOURCE_COUNT);

    const originalNavigationEnvelope = await readCacheEntry(page, cacheKey(NAVIGATION_SOURCE));
    expect(originalNavigationEnvelope).toMatchObject({ data: cachedNavigation });

    modes.navigation = 'failure';
    await page.reload();

    const degradedBanner = page.locator('[data-ouia-component-id="DegradedStateBanner"]');
    await expect(degradedBanner).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect(page.getByRole('link', { name: CACHED_SERVICE_TITLE })).toBeVisible({ timeout: E2E_TIMEOUT });
    await expect.poll(() => observations.cached.size, { timeout: E2E_TIMEOUT }).toBe(FOCUSED_CACHE_SOURCE_COUNT);
    expect(await readCacheEntry(page, cacheKey(NAVIGATION_SOURCE))).toEqual(originalNavigationEnvelope);

    modes.navigation = 'live';
    // A full reload creates a fresh tracker and Jotai state. This checks healthy user-level startup,
    // not same-runtime tracker recovery; unit/integration tests cover that transition.
    await page.reload();

    await expect.poll(() => observations.live.size, { timeout: E2E_TIMEOUT }).toBe(CORE_CONFIG_SOURCE_COUNT);
    await expect(degradedBanner).toBeHidden({ timeout: E2E_TIMEOUT });
  });
});
