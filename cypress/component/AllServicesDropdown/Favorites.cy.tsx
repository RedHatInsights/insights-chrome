import React from 'react';
import AllServicesDropdown from '../../../src/components/AllServicesDropdown/AllServicesDropdown';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ScalprumProvider } from '@scalprum/react-core';
import AllServicesSection from '../../../src/components/AllServices/AllServicesSection';
import AllServicesMenu from '../../../src/components/AllServicesDropdown/AllServicesMenu';

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
        cy.intercept('http://localhost:8080/api/chrome-service/v1/user', {
          "data": {
              "favoritePages": [
                  {
                      "id":1957,
                      "createdAt":"2023-06-05T18:17:26.849084Z",
                      "updatedAt":"2023-06-06T14:32:00.606716Z",
                      "deletedAt":null,
                      "pathname":"/application-services/api-management",
                      "favorite":true,
                      "userIdentityId":59271
                   }
              ]
          }
        });
      });    
      it('Add favorite service', () => {
        function viewFavorites() {
          cy.get('.pf-c-menu-toggle__text').click();
          cy.contains('Favorites').click();
          cy.contains('Test section').click();
          cy.get('.pf-c-icon__content').eq(2).click({ force: true });
          cy.contains('My favorite services').click()
        }
        cy.intercept('http://localhost:8080/api/chrome-service/v1/favorite-pages', {
          "data":{
             "favoritePages":[
                {
                   "id":1957,
                   "createdAt":"2023-06-05T18:17:26.849084Z",
                   "updatedAt":"2023-06-06T14:32:00.606716Z",
                   "deletedAt":null,
                   "pathname":"/application-services/api-management",
                   "favorite":true,
                   "userIdentityId":59271
                }
             ]
          }
        });
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
                pathname: '/test/link',
                favorite: true
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
        viewFavorites();

        });
});