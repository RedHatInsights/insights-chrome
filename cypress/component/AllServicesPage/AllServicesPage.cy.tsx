import React from 'react';
import AllServices from '../../../src/layouts/AllServices';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider as JotaiProvider } from 'jotai';
import { ScalprumProvider } from '@scalprum/react-core';
import { getVisibilityFunctions, initializeVisibilityFunctions } from '../../../src/utils/VisibilitySingleton';
import userFixture from '../../fixtures/testUser.json';
import { ChromeUser } from '@redhat-cloud-services/types';
import { FeatureFlagsProvider } from '../../../src/components/FeatureFlags';
import ChromeAuthContext from '../../../src/auth/ChromeAuthContext';

describe('<AllServices />', () => {
  beforeEach(() => {
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/stable/stage/services/services-generated.json', {
      status: 200,
      fixture: 'services.json',
    }).as('getServices');

    cy.intercept('http://localhost:8080/entry?cacheBuster=*', '').as('getEntry');
    cy.intercept('http://localhost:8080/foo/bar.json', {
      foo: {
        entry: ['/entry'],
      },
    }).as('getFooBar');
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/stable/stage/navigation/settings-navigation.json?ts=*', {
      status: 200,
      fixture: 'settings-navigation.json',
    }).as('getSettingsNav');
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/stable/stage/search/search-index.json').as('getSearchIndexStage');
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/search-index-generated.json').as('getSearchIndexGenerated');
  });

  beforeEach(() => {
    initializeVisibilityFunctions({
      isPreview: false,
      getToken: () => Promise.resolve('mock-token-from-visibility'),
      getUser: () => Promise.resolve(userFixture as unknown as ChromeUser),
      getUserPermissions: () => Promise.resolve([]), // Ensure it's an array
    });
    const visibilityFunctions = getVisibilityFunctions();
    cy.mount(
      <ChromeAuthContext.Provider
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        value={{
          user: userFixture as unknown as ChromeUser,
        }}
      >
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
                  <AllServices />
                </IntlProvider>
              </JotaiProvider>
            </FeatureFlagsProvider>
          </BrowserRouter>
        </ScalprumProvider>
      </ChromeAuthContext.Provider>
    );
  });

  // TODO this is a bad test - we should not couple the tests to the data rendered in the all services page
  it('should filter by service category title', () => {
    cy.get('.pf-v6-c-text-input-group__text-input').type('applicat');
    cy.get('.pf-v6-c-text-input-group__text-input').should('have.value', 'applicat');
    cy.contains('Application Services').should('exist');
    cy.get('.pf-v6-c-card').should('have.length.greaterThan', 1); // Asserts that more than one item is found
  });

  it('shows empty state when no services match filter', () => {
    cy.get('.pf-v6-c-text-input-group__text-input').clear().type('zzzzxyz');
    cy.get('.pf-v6-c-text-input-group__text-input').should('have.value', 'zzzzxyz');

    cy.contains('No results found', { timeout: 2000 }).should('be.visible');
    cy.contains('Clear all filters').should('be.visible');
  });
});
