/// <reference types="cypress" />

import React, { useEffect, useRef, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider, createStore, useAtomValue } from 'jotai';
import { initialize, removeScalprum } from '@scalprum/core';
import { ScalprumProvider } from '@scalprum/react-core';
import { ChromeUser } from '@redhat-cloud-services/types';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../../src/auth/ChromeAuthContext';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Page, PageSidebar, PageSidebarBody } from '@patternfly/react-core/dist/dynamic/components/Page';
import FeatureFlagsProvider from '../../../src/components/FeatureFlags/FeatureFlagsProvider';
import Navigation from '../../../src/components/Navigation';
import { degradedStateAtom } from '../../../src/state/atoms/degradedStateAtom';
import { useInitVisibleBundles, useVisibleBundles, useVisibleBundlesError, useVisibleBundlesReady } from '../../../src/state/atoms/visibleBundlesAtom';
import { initializeVisibilityFunctions } from '../../../src/utils/VisibilitySingleton';
import { _resetInitialization } from '../../../src/utils/iqeEnablement';
import type { IqeAuthRef } from '../../../src/utils/iqeEnablement';
import qe from '../../../src/utils/iqeEnablement';
import testUserJson from '../../fixtures/testUser.json';

const testUser = testUserJson as unknown as ChromeUser;
const entitledUser = { ...testUser, entitlements: { insights: { is_entitled: true, is_trial: false } } } as ChromeUser;
const BUNDLES_PATH = '/api/chrome-service/v1/static/bundles-generated.json';
const FEATURE_FLAGS_PATH = '/api/featureflags/v0?*';
export const FEATURE_FLAGS_CACHE_KEY = `unleash:repository:${testUser.identity.internal?.org_id}:${testUser.identity.internal?.account_id}:repo`;

export const navigation = [
  {
    id: 'insights',
    title: 'Insights',
    navItems: [
      { title: 'Always visible', href: '/insights/home' },
      { title: 'Flag enabled', href: '/insights/flag-enabled', permissions: { method: 'featureFlag', args: ['test.enabled', true] } },
      { title: 'Flag disabled', href: '/insights/flag-disabled', permissions: { method: 'featureFlag', args: ['test.disabled', false] } },
    ],
  },
];

const chromeAuth = (getUser: ChromeAuthContextValue['getUser']): ChromeAuthContextValue => ({
  ssoUrl: '',
  ready: true,
  user: testUser,
  getUser,
  token: 'a.a',
  refreshToken: '',
  logoutAllTabs: () => undefined,
  loginAllTabs: () => undefined,
  logout: () => undefined,
  login: () => Promise.resolve(),
  tokenExpires: 0,
  getToken: () => Promise.resolve('a.a'),
  getRefreshToken: () => Promise.resolve(''),
  getOfflineToken: () => Promise.reject(new Error('not used')),
  doOffline: () => Promise.resolve(),
  reAuthWithScopes: () => Promise.resolve(),
  forceRefresh: () => Promise.resolve(),
  loginSilent: () => Promise.resolve(),
});

const StateProbe = () => {
  const ready = useVisibleBundlesReady();
  const error = useVisibleBundlesError();
  const bundles = useVisibleBundles();
  const visibleItems = bundles[0]?.navItems ?? [];
  const featureFlagsDegraded = useAtomValue(degradedStateAtom).featureFlags;

  return (
    <>
      <div
        data-testid="visibility-state"
        data-ready={String(ready)}
        data-error={String(error)}
        data-item-count={String(visibleItems.length)}
        data-item-titles={visibleItems.map(({ title }) => title).join('|')}
      />
      <div data-testid="feature-flags-health" data-degraded={String(featureFlagsDegraded)} />
    </>
  );
};

const ScenarioContent = () => {
  useInitVisibleBundles();
  const ready = useVisibleBundlesReady();
  const bundle = useVisibleBundles()[0];
  const schema = bundle ? { ...bundle, sortedLinks: [] } : { title: 'Insights', navItems: [], sortedLinks: [] };

  return (
    <>
      <StateProbe />
      <Page
        masthead={
          <Masthead className="chr-c-masthead">
            <div data-testid="chrome-header">Chrome header</div>
          </Masthead>
        }
        sidebar={
          <PageSidebar id="chr-c-sidebar">
            <PageSidebarBody>
              <Navigation loaded={ready && !!bundle} schema={schema} />
            </PageSidebarBody>
          </PageSidebar>
        }
      >
        <div data-testid="chrome-content">Chrome content</div>
      </Page>
    </>
  );
};

const ScenarioHarness = () => {
  const [mounted, setMounted] = useState(false);
  const scalprum = useRef(
    initialize({
      appsConfig: {
        virtualAssistant: {
          name: 'virtualAssistant',
          manifestLocation: '/foo/bar.json',
        },
      },
    })
  );
  const store = useRef(createStore()).current;
  const getUser: ChromeAuthContextValue['getUser'] = () => Promise.resolve(entitledUser);

  useEffect(() => {
    scalprum.current.exposedModules['virtualAssistant#./AstroVirtualAssistant'] = {
      default: () => <div>Virtual Assistant</div>,
    };
    setMounted(true);

    return () => {
      removeScalprum();
      _resetInitialization();
    };
  }, []);

  useEffect(() => {
    const getToken = () => Promise.resolve('a.a');
    initializeVisibilityFunctions({
      getUser,
      getToken,
      getUserPermissions: () => Promise.resolve([]),
      isPreview: true,
    });
    qe.init(store, { current: { user: { access_token: 'a.a' } } as unknown as IqeAuthRef });
  }, [store]);

  if (!mounted) {
    return null;
  }

  return (
    <IntlProvider locale="en">
      <ChromeAuthContext.Provider value={chromeAuth(getUser)}>
        <JotaiProvider store={store}>
          <ScalprumProvider scalprum={scalprum.current}>
            <MemoryRouter initialEntries={['/insights']}>
              <FeatureFlagsProvider>
                <ScenarioContent />
              </FeatureFlagsProvider>
            </MemoryRouter>
          </ScalprumProvider>
        </JotaiProvider>
      </ChromeAuthContext.Provider>
    </IntlProvider>
  );
};

const setupSuccessfulNavigation = (fixture = navigation) => {
  cy.intercept('GET', BUNDLES_PATH, fixture).as('bundles');
  cy.intercept('GET', '**/api/chrome-service/v1/static/stable/stage/navigation/*-navigation.json*', (request) => {
    const bundleId = request.url.match(/navigation\/([^/?]+)-navigation/)?.[1];
    request.reply(fixture.find((bundle) => bundle.id === bundleId) ?? { id: bundleId ?? 'unknown', title: bundleId ?? 'Unknown', navItems: [] });
  });
  cy.intercept('GET', '/config/chrome/*-navigation.json*', (request) => {
    const bundleId = request.url.match(/chrome\/([^/?]+)-navigation/)?.[1];
    request.reply(fixture.find((bundle) => bundle.id === bundleId) ?? { id: bundleId ?? 'unknown', title: bundleId ?? 'Unknown', navItems: [] });
  });
  cy.intercept('GET', '/api/chrome-service/v1/static/service-tiles-generated.json', []).as('serviceTiles');
  cy.intercept('POST', '/api/featureflags/v0/client/*', { statusCode: 200 });
  cy.intercept('GET', '/foo/bar.json', {
    virtualAssistant: { entry: ['/foo/bar.js'] },
  });
  cy.intercept('GET', '/foo/bar.js', { statusCode: 200, body: '' });
};

export const seedFeatureFlagCache = (toggles: unknown[]) =>
  cy.window().then((win) => {
    win.localStorage.setItem(FEATURE_FLAGS_CACHE_KEY, JSON.stringify(toggles));
  });

export const mountScenario = (fixture = navigation) => {
  setupSuccessfulNavigation(fixture);
  cy.intercept('GET', FEATURE_FLAGS_PATH, { statusCode: 503, body: 'unavailable' }).as('featureFlags');
  return <ScenarioHarness />;
};

export const expectHealthyShell = () => {
  cy.get('.chr-c-masthead').should('exist');
  cy.get('[aria-label="Insights Global Navigation"]').should('exist');
  cy.get('[data-testid="visibility-state"]').should('have.attr', 'data-ready', 'true').and('have.attr', 'data-error', 'false');
  cy.get('[data-testid="chrome-content"]').should('contain', 'Chrome content');
};

export const clearVisibilityTestState = () =>
  cy.window().then((win) => {
    win.localStorage.clear();
    win.indexedDB.deleteDatabase('chrome-config-cache');
  });
