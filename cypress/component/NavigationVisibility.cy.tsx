import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider, createStore, useAtomValue } from 'jotai';
import { FlagProvider, InMemoryStorageProvider, UnleashClient } from '@unleash/proxy-client-react';
import { ScalprumProvider } from '@scalprum/react-core';
import localforage from 'localforage';
import { ChromeUser } from '@redhat-cloud-services/types';
import { BundleNavigation, NavItem } from '../../src/@types/types';
import Navigation from '../../src/components/Navigation';
import AllServicesSection from '../../src/components/AllServices/AllServicesSection';
import DegradedStateBanner from '../../src/components/DegradedStateBanner';
import ConfigCacheDegradedStateBridge from '../../src/components/ConfigCacheDegradedStateBridge/ConfigCacheDegradedStateBridge';
import { initializeVisibilityFunctions } from '../../src/utils/VisibilitySingleton';
import { CONFIG_CACHE_FALLBACK_FLAG } from '../../src/utils/cacheFetch';
import { CONFIG_SOURCES, resetConfigCacheStatus } from '../../src/utils/configCacheStatus';
import { UNLEASH_ERROR_KEY, setUnleashClient } from '../../src/components/FeatureFlags/unleashClient';
import { degradedStateAtom } from '../../src/state/atoms/degradedStateAtom';
import {
  useInitVisibleBundles,
  visibleBundlesAtom,
  visibleBundlesErrorAtom,
  visibleBundlesReadyAtom,
  visibleServiceTilesAtom,
  visibleServiceTilesErrorAtom,
  visibleServiceTilesReadyAtom,
} from '../../src/state/atoms/visibleBundlesAtom';
import userFixture from '../fixtures/testUser.json';

const STORAGE_KEY = 'visibility-integration-test';
const BANNER_SELECTOR = '[data-ouia-component-id="DegradedStateBanner"]';
const restrictedLink = {
  id: 'restricted',
  title: 'Restricted',
  href: '/settings/restricted',
  permissions: { method: 'hasLocalStorage', args: [STORAGE_KEY, 'enabled'] },
} satisfies NavItem;
const bundles: BundleNavigation[] = [
  {
    id: 'settings',
    title: 'Settings',
    navItems: [
      {
        groupId: 'working-group',
        title: 'Working group',
        navItems: [restrictedLink, { id: 'working', title: 'Working Link', href: '/settings/working' }],
      },
      { groupId: 'empty-group', title: 'Empty group', navItems: [restrictedLink] },
    ],
  },
];
const tiles = [
  {
    title: 'Service catalog',
    links: [{ isGroup: true as const, title: 'Service group', links: [restrictedLink, { title: 'Working Tile', href: '/working-tile' }] }],
  },
];

// Exercise the production initializer, evaluator, renderers and banner together.
const TestNavigation = () => {
  useInitVisibleBundles();
  const visibleBundles = useAtomValue(visibleBundlesAtom);
  const visibleTiles = useAtomValue(visibleServiceTilesAtom);
  const bundlesReady = useAtomValue(visibleBundlesReadyAtom);
  const tilesReady = useAtomValue(visibleServiceTilesReadyAtom);
  const bundleError = useAtomValue(visibleBundlesErrorAtom);
  const tileError = useAtomValue(visibleServiceTilesErrorAtom);

  return (
    <>
      <ConfigCacheDegradedStateBridge />
      <DegradedStateBanner />
      <div data-testid="ready">{String(bundlesReady && tilesReady)}</div>
      <div data-testid="load-error">{String(bundleError || tileError)}</div>
      {visibleBundles.map((bundle) => (
        <Navigation key={bundle.id} loaded={bundlesReady} schema={{ ...bundle, sortedLinks: [] }} />
      ))}
      {visibleTiles.map((section) => (
        <AllServicesSection key={section.title} {...section} />
      ))}
    </>
  );
};

describe('navigation visibility failure isolation', () => {
  let store: ReturnType<typeof createStore>;
  let client: UnleashClient;
  let browserErrors: unknown[];
  const cache = localforage.createInstance({ name: 'chrome-config-cache', driver: localforage.INDEXEDDB });

  beforeEach(() => {
    store = createStore();
    browserErrors = [];
    resetConfigCacheStatus();
    cy.then(() => cache.clear());
    cy.window().then((win) => {
      win.localStorage.setItem(STORAGE_KEY, 'enabled');
      win.localStorage.setItem(UNLEASH_ERROR_KEY, 'false');
      win.addEventListener('unhandledrejection', (event) => browserErrors.push(event.reason));
    });
    // The shared Cypress setup suppresses uncaught exceptions. Record and assert
    // them here so an unhandled visibility rejection cannot pass unnoticed.
    cy.on('uncaught:exception', (error) => {
      browserErrors.push(error);
      return false;
    });
    initializeVisibilityFunctions({
      getUser: () => Promise.resolve(userFixture as ChromeUser),
      getToken: () => Promise.resolve('test-token'),
      getUserPermissions: () => Promise.resolve([]),
      isPreview: false,
    });
    cy.intercept('GET', '**/api/chrome-service/v1/user*', { favoritePages: [] });
  });

  afterEach(() => {
    client?.stop();
    resetConfigCacheStatus();
  });

  const mountNavigation = (cacheEnabled: boolean, bannerEnabled = true, cached = false) => {
    cy.intercept('GET', '**/bundles-generated.json', cached ? { statusCode: 503 } : { body: bundles });
    cy.intercept('GET', '**/service-tiles-generated.json', cached ? { statusCode: 503 } : { body: tiles });
    if (cached) {
      cy.then(() =>
        Promise.all([
          cache.setItem(`v1:${CONFIG_SOURCES.NAVIGATION}`, { cachedAt: Date.now(), data: bundles }),
          cache.setItem(`v1:${CONFIG_SOURCES.SERVICE_TILES}`, { cachedAt: Date.now(), data: tiles }),
        ])
      );
    }
    cy.then(() => {
      client = new UnleashClient({
        url: `${window.location.origin}/test-flags`,
        clientKey: 'test-key',
        appName: 'visibility-test',
        disableMetrics: true,
        storageProvider: new InMemoryStorageProvider(),
        bootstrap: [
          { name: 'platform.chrome.consume-feo', enabled: true },
          { name: CONFIG_CACHE_FALLBACK_FLAG, enabled: cacheEnabled },
          { name: 'platform.chrome.degraded-state-banner', enabled: bannerEnabled },
        ],
      });
      setUnleashClient(client);
      return new Promise<void>((resolve) => {
        if (client.isReady()) resolve();
        else client.once('ready', resolve);
      });
    });
    cy.then(() =>
      cy.mount(
        <ScalprumProvider config={{}} api={{ chrome: { auth: { getUser: () => Promise.resolve(userFixture) } } }}>
          <Provider store={store}>
            <FlagProvider unleashClient={client} startClient={false}>
              <IntlProvider locale="en">
                <MemoryRouter>
                  <TestNavigation />
                </MemoryRouter>
              </IntlProvider>
            </FlagProvider>
          </Provider>
        </ScalprumProvider>
      )
    );
    cy.get('[data-testid="ready"]').should('have.text', 'true');
    cy.get('[data-testid="load-error"]').should('have.text', 'false');
  };

  const blockStorage = () => {
    cy.window().then((win) => {
      const getItem = win.Storage.prototype.getItem;
      cy.stub(win.Storage.prototype, 'getItem').callsFake(function (this: Storage, key: string) {
        if (key === STORAGE_KEY) throw new DOMException('Storage unavailable', 'SecurityError');
        return getItem.call(this, key);
      });
    });
  };

  [
    { cacheEnabled: false, cached: false, bannerEnabled: true },
    { cacheEnabled: true, cached: false, bannerEnabled: true },
    { cacheEnabled: true, cached: true, bannerEnabled: true },
    { cacheEnabled: false, cached: false, bannerEnabled: false },
  ].forEach(({ cacheEnabled, cached, bannerEnabled }) => {
    it(`preserves working links after a storage exception (cache=${cacheEnabled}, fallback=${cached}, banner=${bannerEnabled})`, () => {
      blockStorage();
      mountNavigation(cacheEnabled, bannerEnabled, cached);

      cy.contains('a', 'Working Link').should('be.visible');
      cy.contains('a', 'Working Tile').should('be.visible');
      cy.contains('Working group').should('be.visible');
      cy.contains('a', 'Restricted').should('not.exist');
      cy.contains('Empty group').should('not.exist');
      if (bannerEnabled) {
        cy.get(BANNER_SELECTOR).should('be.visible').and('contain', 'Navigation').and('contain', 'All Services');
      } else {
        cy.get(BANNER_SELECTOR).should('not.exist');
      }
      cy.then(() => {
        expect(store.get(degradedStateAtom)).to.include({ navigation: true, serviceTiles: true, configFromCache: cached });
        expect(browserErrors).to.deep.equal([]);
      });
    });
  });

  it('renders storage-gated items when the value matches', () => {
    mountNavigation(false);
    cy.get('a[href="/settings/restricted"]').should('have.length', 3);
    cy.get(BANNER_SELECTOR).should('not.exist');
    cy.then(() => expect(browserErrors).to.deep.equal([]));
  });

  it('hides denied items without reporting degradation', () => {
    cy.window().then((win) => win.localStorage.removeItem(STORAGE_KEY));
    mountNavigation(false);
    cy.contains('a', 'Restricted').should('not.exist');
    cy.contains('a', 'Working Link').should('be.visible');
    cy.get(BANNER_SELECTOR).should('not.exist');
    cy.then(() => {
      expect(store.get(degradedStateAtom)).to.include({ navigation: false, serviceTiles: false });
      expect(browserErrors).to.deep.equal([]);
    });
  });
});
