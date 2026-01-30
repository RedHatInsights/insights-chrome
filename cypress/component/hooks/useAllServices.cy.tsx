import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider as JotaiProvider } from 'jotai';
import { ScalprumProvider } from '@scalprum/react-core';
import { getVisibilityFunctions, initializeVisibilityFunctions } from '../../../src/utils/VisibilitySingleton';
import userFixture from '../../fixtures/testUser.json';
import { ChromeUser } from '@redhat-cloud-services/types';
import { FeatureFlagsProvider } from '../../../src/components/FeatureFlags';
import ChromeAuthContext from '../../../src/auth/ChromeAuthContext';
import useAllServices from '../../../src/hooks/useAllServices';
import { getUnleashClient } from '../../../src/components/FeatureFlags/unleashClient';
import useFeoConfig from '../../../src/hooks/useFeoConfig';

// Test component that uses the hook and allows us to control the flag
const TestComponent = () => {
  const { linkSections, error, ready } = useAllServices();
  const useFeoGenerated = useFeoConfig();
  const setFlagValueInternal = (newValue: boolean) => {
    // retrigger flag request to load new flag value
    getUnleashClient().setContextField('foo', newValue.toString());
  };

  return (
    <div>
      <div data-cy="flag-status">Flag: {useFeoGenerated.toString()}</div>
      <div data-cy="ready-status">Ready: {ready.toString()}</div>
      <div data-cy="error-status">Error: {error ? 'true' : 'false'}</div>
      <div data-cy="sections-count">Sections: {linkSections.length}</div>
      <div>
        <button data-cy="toggle-flag" onClick={() => setFlagValueInternal(!useFeoGenerated)}>
          Toggle Flag
        </button>
      </div>
      {linkSections.map((section, index) => (
        <div key={index} data-cy={`section-${index}`}>
          <div data-cy={`section-${index}-title`}>{section.title}</div>
          <div data-cy={`section-${index}-links-count`}>{section.links.length}</div>
          {section.links.map((link, linkIndex) => (
            <div key={linkIndex} data-cy={`section-${index}-link-${linkIndex}-title`}>
              {link.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

describe('useAllServices Hook Race Condition', () => {
  const legacyResponse = [
    {
      title: 'Legacy Section 1',
      links: [
        { title: 'Legacy Link 1', href: '/link1', links: [], isHidden: false },
        { title: 'Legacy Link 2', href: '/link2', links: [], isHidden: false },
      ],
    },
    {
      title: 'Legacy Section 2',
      links: [{ title: 'Legacy Link 3', href: '/link3', links: [], isHidden: false }],
    },
  ];

  const feoResponse = [
    {
      title: 'FEO Section 1',
      links: [
        { title: 'FEO Link 1', href: '/feo-link1', links: [], isHidden: false },
        { title: 'FEO Link 2', href: '/feo-link2', links: [], isHidden: false },
      ],
    },
    {
      title: 'FEO Section 2',
      links: [{ title: 'FEO Link 3', href: '/feo-link3', links: [], isHidden: false }],
    },
  ];

  beforeEach(() => {
    // Initialize visibility functions
    initializeVisibilityFunctions({
      isPreview: false,
      getToken: () => Promise.resolve('mock-token-from-visibility'),
      getUser: () => Promise.resolve(userFixture as unknown as ChromeUser),
      getUserPermissions: () => Promise.resolve([]),
    });

    cy.intercept('/api/featureflags/v0/client/metrics', {
      statusCode: 200,
      body: { featureFlags: [] },
    });

    cy.intercept('GET', '/api/featureflags/v0?sess=*', {
      statusCode: 200,
      body: {
        toggles: [
          {
            name: 'platform.chrome.consume-feo',
            enabled: false,
            variant: {
              name: 'disabled',
              enabled: false,
            },
          },
        ],
      },
    }).as('unleashFlags');

    cy.intercept('/api/featureflags/v0', {
      statusCode: 200,
      body: { featureFlags: [] },
    });
  });

  const prepareComponent = () => {
    const visibilityFunctions = getVisibilityFunctions();

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

    return (
      <ChromeAuthContext.Provider value={mockAuthContext}>
        <ScalprumProvider
          config={{}}
          api={{
            chrome: {
              visibilityFunctions,
              auth: {
                getUser: () => Promise.resolve(userFixture as unknown as ChromeUser),
              },
            },
          }}
        >
          <BrowserRouter>
            <FeatureFlagsProvider>
              <JotaiProvider>
                <IntlProvider locale="en">
                  <TestComponent />
                </IntlProvider>
              </JotaiProvider>
            </FeatureFlagsProvider>
          </BrowserRouter>
        </ScalprumProvider>
      </ChromeAuthContext.Provider>
    );
  };

  it('should handle race condition when flag changes during API request', () => {
    Cypress.on('uncaught:exception', (err) => {
      if (err.message.includes('canceled') && err.name === 'CanceledError') {
        // Allow canceled request via abort controller
        return false;
      }
    });
    // Set up dynamic feature flag intercept that can change during the test
    let flagEnabled = false;
    cy.intercept('GET', '/api/featureflags/v0?*', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          toggles: [
            {
              name: 'platform.chrome.consume-feo',
              enabled: flagEnabled,
              variant: {
                name: flagEnabled ? 'enabled' : 'disabled',
                enabled: flagEnabled,
              },
            },
          ],
        },
      });
    }).as('dynamicUnleashFlags');

    // Set up the race condition intercepts using delay
    cy.intercept('api/chrome-service/v1/static/stable/stage/services/services-generated.json', (req) => {
      req.reply({
        delay: 1500, // 500ms delay for legacy
        statusCode: 200,
        body: legacyResponse,
      });
    }).as('legacyRequest');

    cy.intercept(
      {
        method: 'GET',
        path: '/api/chrome-service/v1/static/service-tiles-generated.json',
      },
      (req) => {
        req.reply({
          delay: 100, // 100ms delay for FEO
          statusCode: 200,
          body: feoResponse,
        });
      }
    ).as('feoRequest');

    // Start with flag off (triggers legacy request)
    const C = prepareComponent();
    cy.mount(C);

    // Wait a bit for the legacy request to start
    cy.wait(200);
    // Change the flag value and trigger a re-fetch
    flagEnabled = true;
    cy.get('[data-cy="toggle-flag"]').click();

    // Verify flag changed
    cy.get('[data-cy="flag-status"]').should('contain', 'Flag: true');

    // Wait for FEO request (fast response)
    cy.wait('@feoRequest');

    // At this point, FEO data should be displayed since it resolves first
    cy.get('[data-cy="section-0-title"]').should('contain', 'FEO Section 1');
    cy.get('[data-cy="section-0-link-0-title"]').should('contain', 'FEO Link 1');

    // Wait for legacy request (slow response) - this should NOT overwrite FEO data
    cy.wait('@legacyRequest');

    // After race condition resolution, we should still have FEO data
    // If there's a bug, this will show Legacy data instead
    cy.get('[data-cy="section-0-title"]').should('contain', 'FEO Section 1');
    cy.get('[data-cy="section-0-link-0-title"]').should('contain', 'FEO Link 1');

    // Verify both requests were made
    cy.get('@legacyRequest.all').should('have.length', 1);
    cy.get('@feoRequest.all').should('have.length', 1);
  });
});
