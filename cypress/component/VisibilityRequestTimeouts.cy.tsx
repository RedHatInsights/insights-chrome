import React, { useState } from 'react';
import { Provider, createStore, useAtomValue, useStore } from 'jotai';
import { FlagProvider, InMemoryStorageProvider, UnleashClient } from '@unleash/proxy-client-react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ScalprumProvider } from '@scalprum/react-core';
import { ChromeUser } from '@redhat-cloud-services/types';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../src/auth/ChromeAuthContext';
import { AnyNavItemPermission, BundleNavigation } from '../../src/@types/types';
import Navigation from '../../src/components/Navigation';
import AllServicesSection from '../../src/components/AllServices/AllServicesSection';
import useSessionConfig from '../../src/hooks/useSessionConfig';
import { getVisibilityFunctions, resetVisibilityFunctions } from '../../src/utils/VisibilitySingleton';
import { VISIBILITY_REQUEST_TIMEOUT_MS } from '../../src/utils/visibilityRequestConfig';
import { resetConfigCacheStatus } from '../../src/utils/configCacheStatus';
import { UNLEASH_ERROR_KEY, setUnleashClient } from '../../src/components/FeatureFlags/unleashClient';
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

const DELAY_MS = VISIBILITY_REQUEST_TIMEOUT_MS * 2;
const READY_TIMEOUT_MS = VISIBILITY_REQUEST_TIMEOUT_MS + 10_000;
const user: ChromeUser = { ...userFixture, identity: { ...userFixture.identity, type: 'User' }, entitlements: {} };
const auth: ChromeAuthContextValue = {
  ssoUrl: '',
  ready: true,
  user,
  getUser: () => Promise.resolve(user),
  getToken: () => Promise.resolve('visibility-test-token'),
  token: 'visibility-test-token',
  refreshToken: '',
  tokenExpires: 0,
  logout: () => undefined,
  logoutAllTabs: () => undefined,
  loginAllTabs: () => undefined,
  login: () => Promise.resolve(),
  loginSilent: () => Promise.resolve(),
  getRefreshToken: () => Promise.resolve(''),
  getOfflineToken: () => Promise.reject(new Error('not used')),
  doOffline: () => Promise.resolve(),
  reAuthWithScopes: () => Promise.resolve(),
  forceRefresh: () => Promise.resolve(),
};

const VisibilityContent = () => {
  useInitVisibleBundles();
  const bundles = useAtomValue(visibleBundlesAtom);
  const tiles = useAtomValue(visibleServiceTilesAtom);
  const bundlesReady = useAtomValue(visibleBundlesReadyAtom);
  const tilesReady = useAtomValue(visibleServiceTilesReadyAtom);
  const bundleError = useAtomValue(visibleBundlesErrorAtom);
  const tileError = useAtomValue(visibleServiceTilesErrorAtom);
  return (
    <>
      <div data-testid="visibility-ready">{String(bundlesReady && tilesReady)}</div>
      <div data-testid="visibility-error">{String(bundleError || tileError)}</div>
      {bundles.map((bundle) => (
        <Navigation key={bundle.id} loaded={bundlesReady} schema={{ ...bundle, sortedLinks: [] }} />
      ))}
      {tilesReady && tiles.map((section) => <AllServicesSection key={section.title} {...section} />)}
    </>
  );
};

// Use the production session bootstrap and visibility initializer. Only auth and
// HTTP responses are fixtures; permissions, transport and HTTP cache are real.
const Session = () => {
  const { configLoaded, gatewayError } = useSessionConfig();
  const [evaluation, setEvaluation] = useState(0);
  const store = useStore();
  return (
    <>
      <div data-testid="config-ready">{String(configLoaded)}</div>
      <div data-testid="gateway-error">{String(Boolean(gatewayError))}</div>
      <button
        onClick={() => {
          store.set(visibleBundlesReadyAtom, false);
          store.set(visibleServiceTilesReadyAtom, false);
          // Remount only the evaluator. The session and its permission watcher
          // survive, so recovery cannot be faked by clearing permission caches.
          setEvaluation((value) => value + 1);
        }}
      >
        Reevaluate visibility
      </button>
      {configLoaded && <VisibilityContent key={evaluation} />}
    </>
  );
};

type Scenario = {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  permission: AnyNavItemPermission;
  response: object;
  paginated?: boolean;
};

const scenarios: Scenario[] = [
  {
    name: 'RBAC',
    url: '**/api/rbac/v1/access/*',
    method: 'GET',
    permission: { method: 'hasPermissions', args: [['inventory:hosts:read']] },
    response: { data: [{ permission: 'inventory:hosts:read' }], meta: { count: 1 } },
  },
  {
    name: 'paginated RBAC',
    url: '**/api/rbac/v1/access/*',
    method: 'GET',
    permission: { method: 'hasPermissions', args: [['inventory:hosts:read']] },
    response: { data: [{ permission: 'inventory:hosts:read' }], meta: { count: 1001 } },
    paginated: true,
  },
  {
    name: 'Kessel checkself',
    url: '**/api/kessel/v1beta2/checkself',
    method: 'POST',
    permission: { method: 'loosePermissionsKessel', args: [['rbac_roles_read']] },
    response: { allowed: 'ALLOWED_TRUE' },
  },
  {
    name: 'Kessel checkselfbulk',
    url: '**/api/kessel/v1beta2/checkselfbulk',
    method: 'POST',
    permission: { method: 'loosePermissionsKessel', args: [['rbac_roles_read', 'rbac_groups_read']] },
    response: { pairs: [{ item: { allowed: 'ALLOWED_FALSE' } }, { item: { allowed: 'ALLOWED_TRUE' } }] },
  },
  {
    name: 'apiRequest',
    url: '**/api/content-sources/v1.0/features/',
    method: 'GET',
    permission: {
      method: 'apiRequest',
      args: [{ url: '/api/content-sources/v1.0/features/', accessor: 'lightwell.accessible', timeout: 0 }],
    },
    response: { lightwell: { accessible: true } },
  },
];

describe('visibility HTTP timeouts', () => {
  let client: UnleashClient;
  let browserErrors: unknown[];
  let timedOutRequests: number;
  let onUnhandled: (event: PromiseRejectionEvent) => void;

  beforeEach(() => {
    browserErrors = [];
    timedOutRequests = 0;
    resetVisibilityFunctions();
    resetConfigCacheStatus();
    cy.window().then((win) => {
      win.localStorage.setItem(UNLEASH_ERROR_KEY, 'false');
      onUnhandled = (event) => browserErrors.push(event.reason);
      win.addEventListener('unhandledrejection', onUnhandled);
      const send = win.XMLHttpRequest.prototype.send;
      cy.stub(win.XMLHttpRequest.prototype, 'send').callsFake(function (this: XMLHttpRequest, body) {
        this.addEventListener('timeout', () => timedOutRequests++);
        return send.call(this, body);
      });
    });
    // Global Cypress support suppresses exceptions, so assert them ourselves.
    cy.on('uncaught:exception', (error) => {
      browserErrors.push(error);
      return false;
    });
    cy.intercept('GET', '**/api/chrome-service/v1/user*', { data: { uiPreview: false, uiPreviewSeen: true }, favoritePages: [] });
  });

  afterEach(() => {
    client?.stop();
    resetVisibilityFunctions();
    resetConfigCacheStatus();
    cy.window().then((win) => {
      win.removeEventListener('unhandledrejection', onUnhandled);
      expect(browserErrors, 'unhandled browser errors').to.deep.equal([]);
    });
  });

  scenarios.forEach((scenario) => {
    it(`finishes bootstrap and recovers after a real ${scenario.name} timeout`, () => {
      let recover = false;
      let requests = 0;
      let failedRequestCount = 0;
      let visibility: ReturnType<typeof getVisibilityFunctions>;
      const tilePermission: AnyNavItemPermission =
        scenario.permission.method === 'hasPermissions' ? { ...scenario.permission, method: 'loosePermissions' } : scenario.permission;
      const bundles: BundleNavigation[] = [
        {
          id: 'settings',
          title: 'Settings',
          navItems: [
            { id: 'healthy', title: 'Healthy Nav', href: '/settings/healthy' },
            { id: 'restricted', title: 'Restricted Nav', href: '/settings/restricted', permissions: scenario.permission },
          ],
        },
      ];
      const tiles = [
        {
          title: 'All Services',
          links: [
            { title: 'Healthy tile', href: '/healthy-tile' },
            { title: 'Restricted tile', href: '/restricted-tile', permissions: tilePermission },
          ],
        },
      ];
      cy.intercept('GET', '**/bundles-generated.json', { body: bundles });
      cy.intercept('GET', '**/service-tiles-generated.json', { body: tiles });
      cy.intercept(scenario.method, scenario.url, (request) => {
        requests++;
        const offset = Number(new URL(request.url).searchParams.get('offset') || 0);
        const delayed = !recover && (!scenario.paginated || offset === 1000);
        if (scenario.name === 'apiRequest') expect(request.headers.authorization).to.equal('Bearer visibility-test-token');
        request.reply({
          statusCode: 200,
          delay: delayed ? DELAY_MS : 0,
          // Isolate browser test cases without resetting the live permission
          // watcher between a failed request and recovery.
          headers: { 'cache-control': 'no-store' },
          body: scenario.paginated && offset >= 2000 ? { data: [], meta: { count: 1001 } } : scenario.response,
        });
      });

      cy.then(() => {
        client = new UnleashClient({
          url: `${window.location.origin}/test-flags`,
          clientKey: 'test-key',
          appName: 'visibility-timeout-test',
          disableMetrics: true,
          storageProvider: new InMemoryStorageProvider(),
          bootstrap: [{ name: 'platform.chrome.consume-feo', enabled: true, impressionData: false, variant: { name: 'disabled', enabled: false } }],
        });
        setUnleashClient(client);
        return new Promise<void>((resolve) => {
          if (client.isReady()) resolve();
          else client.once('ready', resolve);
        });
      });
      cy.then(() =>
        cy.mount(
          <ChromeAuthContext.Provider value={auth}>
            <ScalprumProvider config={{}} api={{ chrome: { auth } }}>
              <Provider store={createStore()}>
                <FlagProvider unleashClient={client} startClient={false}>
                  <IntlProvider locale="en">
                    <MemoryRouter>
                      <Session />
                    </MemoryRouter>
                  </IntlProvider>
                </FlagProvider>
              </Provider>
            </ScalprumProvider>
          </ChromeAuthContext.Provider>
        )
      );
      cy.get('[data-testid="config-ready"]').should('have.text', 'true');
      cy.get('[data-testid="visibility-ready"]').should('have.text', 'false');
      cy.get('[data-testid="visibility-ready"]', { timeout: READY_TIMEOUT_MS }).should('have.text', 'true');
      cy.get('[data-testid="visibility-error"]').should('have.text', 'false');
      cy.get('[data-testid="gateway-error"]').should('have.text', 'false');
      cy.contains('a', 'Healthy Nav').should('be.visible');
      cy.contains('a', 'Healthy tile').should('be.visible');
      cy.contains('a', 'Restricted Nav').should('not.exist');
      cy.contains('a', 'Restricted tile').should('not.exist');
      cy.then(() => {
        expect(timedOutRequests, 'native XHR timeout events').to.be.greaterThan(0);
        expect(browserErrors).to.deep.equal([]);
        visibility = getVisibilityFunctions();
        failedRequestCount = requests;
        recover = true;
      });
      cy.contains('button', 'Reevaluate visibility').click();
      cy.get('[data-testid="visibility-ready"]', { timeout: READY_TIMEOUT_MS }).should('have.text', 'true');
      cy.contains('a', 'Restricted Nav').should('be.visible');
      cy.contains('a', 'Restricted tile').should('be.visible');
      cy.get('[data-testid="visibility-error"]').should('have.text', 'false');
      cy.then(() => {
        expect(getVisibilityFunctions(), 'same session callbacks after recovery').to.equal(visibility);
        expect(requests).to.be.greaterThan(failedRequestCount);
      });
    });
  });
});
