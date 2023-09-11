import React from 'react';
import AllServicesDropdown from '../../../src/components/AllServicesDropdown/AllServicesDropdown';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ScalprumProvider } from '@scalprum/react-core';

describe('<AllServicesDropdown />', () => {
  beforeEach(() => {
    // mock chrome and scalprum generic requests
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/stable/stage/navigation/*-navigation.json?ts=*', {
      data: [],
    });
    cy.intercept('http://localhost:8080/entry?cacheBuster=*', '');
    cy.intercept('http://localhost:8080/foo/bar.json', {
      foo: {
        entry: ['/entry'],
      },
    });
  });

  it('should close all services dropdown in link matches current pathname', () => {
    function checkMenuClosed() {
      cy.get('.pf-v5-c-menu-toggle__text').click();
      cy.contains('Browse all services').should('exist');
      cy.contains('Favorites').click();
      cy.contains('Test section').click();
      cy.contains('Test link').click();
      cy.contains('Browse all services').should('not.exist');
    }
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/stable/stage/services/services.json', [
      {
        id: 'testSection',
        description: 'Test section description',
        title: 'Test section',
        icon: 'CloudUploadAltIcon',
        links: [
          {
            title: 'Test Link',
            href: '/test/link',
            description: 'Test link description',
          },
        ],
      },
    ]);
    cy.window().then((win) => {
      (win as any).foo = {
        init: () => undefined,
        get: () => () => ({
          default: () => <div>Foo</div>,
        }),
      };
    });
    const store = createStore(() => ({
      chrome: {
        moduleRoutes: [
          {
            path: '/test/link',
            scope: 'foo',
            module: 'bar',
          },
        ],
      },
    }));
    cy.mount(
      <ScalprumProvider
        config={{
          foo: {
            name: 'foo',
            manifestLocation: '/foo/bar.json',
          },
        }}
      >
        <Provider store={store}>
          <BrowserRouter>
            <IntlProvider locale="en">
              <AllServicesDropdown />
            </IntlProvider>
          </BrowserRouter>
        </Provider>
      </ScalprumProvider>
    );

    // Click the link for the first time, closes automatically based on route change
    checkMenuClosed();

    // Run the procedure again and check if the menu closed
    checkMenuClosed();
  });
});
