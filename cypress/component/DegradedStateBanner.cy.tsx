import React from 'react';
import DegradedStateBanner from '../../src/components/DegradedStateBanner/DegradedStateBanner';
import { Provider, createStore } from 'jotai';
import { FlagProvider } from '@unleash/proxy-client-react';
import { IntlProvider } from 'react-intl';
import { ServiceHealthStatus, degradedStateAtom } from '../../src/state/atoms/degradedStateAtom';

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

  const mountBanner = (degradedState: ServiceHealthStatus) => {
    const store = createStore();
    store.set(degradedStateAtom, degradedState);

    cy.mount(
      <IntlProvider locale="en">
        <FlagProvider config={mockUnleashConfig}>
          <Provider store={store}>
            <DegradedStateBanner />
          </Provider>
        </FlagProvider>
      </IntlProvider>
    );
  };
  it('should not render when all services healthy', () => {
    mountBanner({ userPersonalization: false, entitlements: false, configFromCache: false, featureFlags: false });

    cy.get('[data-ouia-component-id="DegradedStateBanner"]').should('not.exist');
    cy.contains(/some services are degraded/i).should('not.exist');
  });

  it('should render banner with single degraded service', () => {
    mountBanner({ userPersonalization: true, entitlements: false, configFromCache: false, featureFlags: false });

    cy.get('[data-ouia-component-id="DegradedStateBanner"]')
      .should('be.visible')
      .should('contain', 'User Preferences')
      .should('contain', 'Core functionality is available')
      .should('contain', 'Try again later');
  });

  it('should render banner with multiple degraded services', () => {
    mountBanner({ userPersonalization: true, entitlements: true, configFromCache: false, featureFlags: false });

    cy.get('[data-ouia-component-id="DegradedStateBanner"]').should('be.visible').should('contain', 'User Preferences').should('contain', 'Entitlements');
  });

  it('should always show warning variant', () => {
    mountBanner({ userPersonalization: true, entitlements: false, configFromCache: false, featureFlags: false });

    cy.get('[data-ouia-component-id="DegradedStateBanner"]').should('exist').should('have.attr', 'data-ouia-component-id', 'DegradedStateBanner');
  });

  it('should list all degraded services', () => {
    mountBanner({ userPersonalization: true, entitlements: true, configFromCache: true, featureFlags: true });

    cy.get('[data-ouia-component-id="DegradedStateBanner"]')
      .should('be.visible')
      .should('contain', 'User Preferences')
      .should('contain', 'Entitlements')
      .should('contain', 'Navigation Configuration')
      .should('contain', 'Feature Flags');
  });
});
