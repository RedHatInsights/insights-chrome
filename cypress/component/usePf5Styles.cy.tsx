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

function getPf5Stylesheet(doc: Document): HTMLLinkElement | null | undefined {
  return Array.from(doc.querySelectorAll('link')).find((l) => l.href.includes('/apps/chrome/js/pf/pf4-v5.css'));
}

function expectPf5StylesheetToExist(timeout = 5000) {
  cy.document({ timeout }).should((doc) => {
    const link = getPf5Stylesheet(doc);
    expect(link, 'PF5 stylesheet should exist').to.exist;
    expect(link?.rel).to.equal('stylesheet');
    expect(link?.type).to.equal('text/css');
    expect(link?.href).to.include('/apps/chrome/js/pf/pf4-v5.css');
  });
}

function expectPf5StylesheetToNotExist(timeout = 5000) {
  cy.document({ timeout }).should((doc) => {
    const link = getPf5Stylesheet(doc);
    expect(link, 'PF5 stylesheet should not exist').to.be.undefined;
  });
}

// Helper to set localStorage with verification
function setLocalStorageAndVerify(key: string, value: string | null) {
  cy.window().then((win) => {
    if (value === null) {
      win.localStorage.removeItem(key);
    } else {
      win.localStorage.setItem(key, value);
    }
  });

  // Verify the value was actually set/removed
  cy.window()
    .its('localStorage')
    .invoke('getItem', key)
    .should(value === null ? 'be.null' : 'equal', value);
}

// Helper to configure localStorage for a test
function withLocalStorage(value: string | null = null) {
  if (value !== null) {
    setLocalStorageAndVerify('@chrome/pf-5-enabled', value);
  }
}

describe('usePf5Styles Hook', () => {
  beforeEach(() => {
    // Force clear ALL localStorage (more aggressive approach)
    cy.window().then((win) => {
      // Clear our specific key
      win.localStorage.removeItem('@chrome/pf-5-enabled');
      // Also clear all localStorage to prevent interference from other tests
      win.localStorage.clear();
    });

    // Verify localStorage is actually cleared
    cy.window().its('localStorage').invoke('getItem', '@chrome/pf-5-enabled').should('be.null');

    // Clear any existing PF5 stylesheets and font overrides
    cy.document().then((doc) => {
      const existingLink = doc.getElementById('pf5-stylesheet');
      if (existingLink) {
        existingLink.remove();
      }
      const existingOverride = doc.getElementById('pf6-font-override');
      if (existingOverride) {
        existingOverride.remove();
      }
      // Also remove any lingering link elements that might match our selector
      const allPf5Links = Array.from(doc.querySelectorAll('link')).filter((l) => l.href && l.href.includes('/apps/chrome/js/pf/pf4-v5.css'));
      allPf5Links.forEach((link) => link.remove());
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

  describe('When no localStorage override is set', () => {
    // localStorage is already cleared in main beforeEach

    it('should inject stylesheet when feature flag is enabled', () => {
      mountWithFeatureFlag(true);
      cy.wait('@featureFlags');
      expectPf5StylesheetToExist();
    });

    it('should not inject stylesheet when feature flag is disabled', () => {
      mountWithFeatureFlag(false);
      cy.wait('@featureFlags');
      expectPf5StylesheetToNotExist();
    });
  });

  describe('When localStorage override is set to "true"', () => {
    beforeEach(() => {
      withLocalStorage('true');
    });

    it('should inject stylesheet regardless of feature flag being disabled', () => {
      mountWithFeatureFlag(false);
      cy.wait('@featureFlags');
      expectPf5StylesheetToExist();
    });

    it('should inject stylesheet when feature flag is also enabled', () => {
      mountWithFeatureFlag(true);
      cy.wait('@featureFlags');
      expectPf5StylesheetToExist();
    });
  });

  describe('When localStorage override is set to "false"', () => {
    beforeEach(() => {
      withLocalStorage('false');
    });

    it('should not inject stylesheet regardless of feature flag being enabled', () => {
      mountWithFeatureFlag(true);
      cy.wait('@featureFlags');
      expectPf5StylesheetToNotExist();
    });

    it('should not inject stylesheet when feature flag is also disabled', () => {
      mountWithFeatureFlag(false);
      cy.wait('@featureFlags');
      expectPf5StylesheetToNotExist();
    });
  });

  describe('When localStorage has invalid value', () => {
    beforeEach(() => {
      withLocalStorage('invalid-value');
    });

    it('should fall back to feature flag when enabled', () => {
      mountWithFeatureFlag(true);
      cy.wait('@featureFlags');
      expectPf5StylesheetToExist();
    });

    it('should fall back to feature flag when disabled', () => {
      mountWithFeatureFlag(false);
      cy.wait('@featureFlags');
      expectPf5StylesheetToNotExist();
    });
  });

  describe('Component lifecycle', () => {
    it('should remove stylesheet on component unmount', () => {
      withLocalStorage('true');

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
      expectPf5StylesheetToExist();

      // Unmount by hiding component
      cy.mount(<TestWrapper showComponent={false} />);
      expectPf5StylesheetToNotExist();
    });

    it('should only create one stylesheet element even with multiple components', () => {
      withLocalStorage('true');

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
      cy.document().should((doc) => {
        const links = doc.querySelectorAll('#pf5-stylesheet');
        expect(links.length, 'Only one PF5 stylesheet should exist').to.equal(1);
      });
    });
  });

  describe('Dynamic behavior', () => {
    it('should handle dynamic localStorage changes', () => {
      // Start with feature flag disabled and no localStorage
      mountWithFeatureFlag(false);
      cy.wait('@featureFlags');
      expectPf5StylesheetToNotExist();

      // Set localStorage override and remount
      withLocalStorage('true');
      mountWithFeatureFlag(false);
      expectPf5StylesheetToExist();

      // Change localStorage to false and remount
      withLocalStorage('false');
      mountWithFeatureFlag(false);
      expectPf5StylesheetToNotExist();
    });
  });
});
