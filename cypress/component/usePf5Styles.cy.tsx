/* eslint-disable @typescript-eslint/no-unused-expressions */
import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { FeatureFlagsProvider } from '../../src/components/FeatureFlags';
import ChromeAuthContext from '../../src/auth/ChromeAuthContext';
import { ChromeUser } from '@redhat-cloud-services/types';
import usePf5Styles from '../../src/hooks/usePf5Styles';
import userFixture from '../fixtures/testUser.json';

// Test component that uses the hook and allows us to control behavior
const TestComponent = ({ testId = 'test-component' }: { testId?: string }) => {
  usePf5Styles();
  return <div data-cy={testId}>Test Component Using usePf5Styles</div>;
};

describe('usePf5Styles Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.window().then((win) => {
      win.localStorage.removeItem('@chrome/pf-5-enabled');
    });

    // Clear any existing PF5 stylesheets
    cy.document().then((doc) => {
      const existingLink = doc.getElementById('pf5-stylesheet');
      if (existingLink) {
        existingLink.remove();
      }
    });
  });

  const mountWithFeatureFlag = (flagEnabled: boolean) => {
    // Set up feature flag mock
    cy.intercept('/api/featureflags/v0/client/metrics', {
      statusCode: 200,
      body: { featureFlags: [] },
    });

    cy.intercept('GET', '/api/featureflags/v0?*', {
      statusCode: 200,
      body: {
        toggles: [
          {
            name: 'platform.chrome.pf5',
            enabled: flagEnabled,
            variant: {
              name: flagEnabled ? 'enabled' : 'disabled',
              enabled: flagEnabled,
            },
          },
        ],
      },
    }).as('featureFlags');

    const mockAuthContext = {
      ssoUrl: '',
      ready: true,
      user: userFixture as unknown as ChromeUser,
      getUser: () => Promise.resolve(userFixture as unknown as ChromeUser),
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      logoutAllTabs: () => {},
      loginAllTabs: () => {},
      logout: () => {},
      login: () => Promise.resolve(),
      tokenExpires: Date.now() + 3600000,
      getToken: () => Promise.resolve('mock-token'),
      getRefreshToken: () => Promise.resolve('mock-refresh-token'),
      getOfflineToken: () => Promise.resolve({ data: {} } as any),
      doOffline: () => Promise.resolve(),
      reAuthWithScopes: () => Promise.resolve(),
      forceRefresh: () => Promise.resolve({}),
      loginSilent: () => Promise.resolve(),
    };

    cy.mount(
      <ChromeAuthContext.Provider value={mockAuthContext}>
        <JotaiProvider>
          <FeatureFlagsProvider>
            <TestComponent />
          </FeatureFlagsProvider>
        </JotaiProvider>
      </ChromeAuthContext.Provider>
    );
  };

  it('should inject stylesheet when feature flag is enabled', () => {
    mountWithFeatureFlag(true);

    cy.wait('@featureFlags');

    // Check that stylesheet is injected into DOM
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet') as HTMLLinkElement;
      expect(link).to.exist;
      expect(link.rel).to.equal('stylesheet');
      expect(link.type).to.equal('text/css');
      expect(link.href).to.include('/apps/chrome/js/pf/pf4-v5.css');
    });
  });

  it('should not inject stylesheet when feature flag is disabled', () => {
    mountWithFeatureFlag(false);

    cy.wait('@featureFlags');

    // Check that stylesheet is NOT injected into DOM
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet');
      expect(link).to.not.exist;
    });
  });

  it('should inject stylesheet when localStorage override is "true" regardless of feature flag', () => {
    // Set localStorage override to true
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'true');
    });

    // Mount with feature flag disabled
    mountWithFeatureFlag(false);

    cy.wait('@featureFlags');

    // Check that stylesheet is injected due to localStorage override
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet') as HTMLLinkElement;
      expect(link).to.exist;
      expect(link.rel).to.equal('stylesheet');
      expect(link.type).to.equal('text/css');
      expect(link.href).to.include('/apps/chrome/js/pf/pf4-v5.css');
    });
  });

  it('should not inject stylesheet when localStorage override is "false" regardless of feature flag', () => {
    // Set localStorage override to false
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'false');
    });

    // Mount with feature flag enabled
    mountWithFeatureFlag(true);

    cy.wait('@featureFlags');

    // Check that stylesheet is NOT injected due to localStorage override
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet');
      expect(link).to.not.exist;
    });
  });

  it('should fall back to feature flag when localStorage has invalid value', () => {
    // Set localStorage to invalid value
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'invalid-value');
    });

    // Mount with feature flag enabled
    mountWithFeatureFlag(true);

    cy.wait('@featureFlags');

    // Check that stylesheet is injected (fallback to feature flag)
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet') as HTMLLinkElement;
      expect(link).to.exist;
      expect(link.href).to.include('/apps/chrome/js/pf/pf4-v5.css');
    });
  });

  it('should fall back to feature flag when localStorage is not set', () => {
    // Ensure localStorage is not set (already cleared in beforeEach)

    // Mount with feature flag enabled
    mountWithFeatureFlag(true);

    cy.wait('@featureFlags');

    // Check that stylesheet is injected (fallback to feature flag)
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet') as HTMLLinkElement;
      expect(link).to.exist;
      expect(link.href).to.include('/apps/chrome/js/pf/pf4-v5.css');
    });
  });

  it('should remove stylesheet on component unmount', () => {
    // First mount with styles enabled
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'true');
    });

    const mockAuthContext = {
      ssoUrl: '',
      ready: true,
      user: userFixture as unknown as ChromeUser,
      getUser: () => Promise.resolve(userFixture as unknown as ChromeUser),
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      logoutAllTabs: () => {},
      loginAllTabs: () => {},
      logout: () => {},
      login: () => Promise.resolve(),
      tokenExpires: Date.now() + 3600000,
      getToken: () => Promise.resolve('mock-token'),
      getRefreshToken: () => Promise.resolve('mock-refresh-token'),
      getOfflineToken: () => Promise.resolve({ data: {} } as any),
      doOffline: () => Promise.resolve(),
      reAuthWithScopes: () => Promise.resolve(),
      forceRefresh: () => Promise.resolve({}),
      loginSilent: () => Promise.resolve(),
    };

    const TestWrapper = ({ showComponent }: { showComponent: boolean }) => (
      <ChromeAuthContext.Provider value={mockAuthContext}>
        <JotaiProvider>
          <FeatureFlagsProvider>
            {showComponent && <TestComponent testId="conditional-component" />}
            <div data-cy="wrapper">Wrapper</div>
          </FeatureFlagsProvider>
        </JotaiProvider>
      </ChromeAuthContext.Provider>
    );

    // Mount with component shown
    cy.mount(<TestWrapper showComponent={true} />);

    // Verify stylesheet is present
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet');
      expect(link).to.exist;
    });

    // Unmount by hiding component
    cy.mount(<TestWrapper showComponent={false} />);

    // Verify stylesheet is removed
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet');
      expect(link).to.not.exist;
    });
  });

  it('should handle dynamic localStorage changes', () => {
    // Start with feature flag disabled and no localStorage
    mountWithFeatureFlag(false);

    cy.wait('@featureFlags');

    // Initially no stylesheet
    cy.document().then((doc) => {
      expect(doc.getElementById('pf5-stylesheet')).to.not.exist;
    });

    // Set localStorage override and remount
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'true');
    });

    // Remount to trigger effect
    mountWithFeatureFlag(false);

    // Now stylesheet should be present
    cy.document().then((doc) => {
      const link = doc.getElementById('pf5-stylesheet');
      expect(link).to.exist;
    });

    // Change localStorage to false and remount
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'false');
    });

    // Remount to trigger effect
    mountWithFeatureFlag(false);

    // Now stylesheet should be removed
    cy.document().then((doc) => {
      expect(doc.getElementById('pf5-stylesheet')).to.not.exist;
    });
  });

  it('should only create one stylesheet element even with multiple components', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'true');
    });

    const mockAuthContext = {
      ssoUrl: '',
      ready: true,
      user: userFixture as unknown as ChromeUser,
      getUser: () => Promise.resolve(userFixture as unknown as ChromeUser),
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      logoutAllTabs: () => {},
      loginAllTabs: () => {},
      logout: () => {},
      login: () => Promise.resolve(),
      tokenExpires: Date.now() + 3600000,
      getToken: () => Promise.resolve('mock-token'),
      getRefreshToken: () => Promise.resolve('mock-refresh-token'),
      getOfflineToken: () => Promise.resolve({ data: {} } as any),
      doOffline: () => Promise.resolve(),
      reAuthWithScopes: () => Promise.resolve(),
      forceRefresh: () => Promise.resolve({}),
      loginSilent: () => Promise.resolve(),
    };

    const MultiComponentWrapper = () => (
      <ChromeAuthContext.Provider value={mockAuthContext}>
        <JotaiProvider>
          <FeatureFlagsProvider>
            <TestComponent testId="component-1" />
            <TestComponent testId="component-2" />
            <TestComponent testId="component-3" />
          </FeatureFlagsProvider>
        </JotaiProvider>
      </ChromeAuthContext.Provider>
    );

    cy.mount(<MultiComponentWrapper />);

    // Check that only one stylesheet exists
    cy.document().then((doc) => {
      const links = doc.querySelectorAll('#pf5-stylesheet');
      expect(links.length).to.equal(1);
    });
  });

  it('should handle the priority logic correctly: localStorage > feature flag', () => {
    // Test case 1: localStorage "true" overrides feature flag false
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'true');
    });

    mountWithFeatureFlag(false);
    cy.wait('@featureFlags');

    cy.document().then((doc) => {
      expect(doc.getElementById('pf5-stylesheet')).to.exist;
    });

    // Test case 2: localStorage "false" overrides feature flag true
    cy.window().then((win) => {
      win.localStorage.setItem('@chrome/pf-5-enabled', 'false');
    });

    mountWithFeatureFlag(true);
    cy.wait('@featureFlags');

    cy.document().then((doc) => {
      expect(doc.getElementById('pf5-stylesheet')).to.not.exist;
    });

    // Test case 3: No localStorage, use feature flag true
    cy.window().then((win) => {
      win.localStorage.removeItem('@chrome/pf-5-enabled');
    });

    mountWithFeatureFlag(true);
    cy.wait('@featureFlags');

    cy.document().then((doc) => {
      expect(doc.getElementById('pf5-stylesheet')).to.exist;
    });

    // Test case 4: No localStorage, use feature flag false
    cy.window().then((win) => {
      win.localStorage.removeItem('@chrome/pf-5-enabled');
    });

    mountWithFeatureFlag(false);
    cy.wait('@featureFlags');

    cy.document().then((doc) => {
      expect(doc.getElementById('pf5-stylesheet')).to.not.exist;
    });
  });
});
