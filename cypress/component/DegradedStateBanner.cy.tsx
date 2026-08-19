import React from 'react';
import DegradedStateBanner from '../../src/components/DegradedStateBanner/DegradedStateBanner';
import { Provider } from 'jotai';
import { createStore } from 'jotai';
import { FlagProvider } from '@unleash/proxy-client-react';
import { degradedStateAtom } from '../../src/state/atoms/degradedStateAtom';

// Mock Unleash config for testing
const mockUnleashConfig = {
  url: 'http://localhost:4242/api/frontend',
  clientKey: 'test-key',
  appName: 'test-app',
  refreshInterval: 0,
  disableRefresh: true,
  bootstrap: [
    {
      name: 'platform.chrome.degraded-state-banner',
      enabled: true,
      variant: { name: 'enabled', enabled: true },
      impressionData: false,
    },
  ],
};

describe('DegradedStateBanner', () => {
  beforeEach(() => {
    // Mock Unleash API calls to prevent real requests
    cy.intercept('GET', '**/api/frontend**', {
      statusCode: 200,
      body: { toggles: [] },
    });
    cy.intercept('POST', '**/api/frontend**', { statusCode: 200 });
  });
  it('should not render when all services healthy', () => {
    const store = createStore();

    cy.mount(
      <FlagProvider config={mockUnleashConfig}>
        <Provider store={store}>
          <DegradedStateBanner />
        </Provider>
      </FlagProvider>
    );

    cy.contains(/some services are degraded/i).should('not.exist');
  });

  it('should render banner with single degraded service', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });

    cy.mount(
      <FlagProvider config={mockUnleashConfig}>
        <Provider store={store}>
          <DegradedStateBanner />
        </Provider>
      </FlagProvider>
    );

    cy.contains(/user preferences/i).should('be.visible');
    cy.contains(/core functionality is available/i).should('be.visible');
    cy.contains(/try again later/i).should('be.visible');
  });

  it('should render banner with multiple degraded services', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: true,
      configFromCache: false,
      featureFlags: false,
    });

    cy.mount(
      <FlagProvider config={mockUnleashConfig}>
        <Provider store={store}>
          <DegradedStateBanner />
        </Provider>
      </FlagProvider>
    );

    cy.contains(/user preferences/i).should('be.visible');
    cy.contains(/entitlements/i).should('be.visible');
  });

  it('should always show warning variant', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });

    cy.mount(
      <FlagProvider config={mockUnleashConfig}>
        <Provider store={store}>
          <DegradedStateBanner />
        </Provider>
      </FlagProvider>
    );

    cy.get('.pf-m-warning').should('exist');
  });

  it('should list all degraded services', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: true,
      configFromCache: true,
      featureFlags: true,
    });

    cy.mount(
      <FlagProvider config={mockUnleashConfig}>
        <Provider store={store}>
          <DegradedStateBanner />
        </Provider>
      </FlagProvider>
    );

    cy.contains(/user preferences/i).should('be.visible');
    cy.contains(/entitlements/i).should('be.visible');
    cy.contains(/navigation configuration/i).should('be.visible');
    cy.contains(/feature flags/i).should('be.visible');
  });
});
