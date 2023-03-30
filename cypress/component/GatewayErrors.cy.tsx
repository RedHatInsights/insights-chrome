import React, { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import logger from 'redux-logger';
import { AppMetadata, removeScalprum } from '@scalprum/core';

import ScalprumRoot from '../../src/components/RootApp/ScalprumRoot';
import chromeReducer from '../../src/redux';
import { FeatureFlagsProvider } from '../../src/components/FeatureFlags';
import { loadModulesSchema, userLogIn } from '../../src/redux/actions';
import qe from '../../src/utils/iqeEnablement';
import { COMPLIACE_ERROR_CODES } from '../../src/utils/responseInterceptors';
import LibtJWTContext from '../../src/components/LibJWTContext';
import testUserJson from '../fixtures/testUser.json';
import { ChromeUser } from '@redhat-cloud-services/types';
import type { LibJWT } from '../../src/auth';
import { RemoteModule } from '../../src/@types/types';
import { BLOCK_CLEAR_GATEWAY_ERROR } from '../../src/utils/common';

const testUser: ChromeUser = testUserJson as unknown as ChromeUser;

function createEnv(code?: string) {
  if (!code) {
    throw 'Enviroment must have identifier';
  }
  const reduxStore = createStore(combineReducers(chromeReducer()), applyMiddleware(logger));
  // initialize user object for feature flags
  reduxStore.dispatch(userLogIn(testUser));
  // initializes request interceptors
  qe.init(reduxStore);
  reduxStore.dispatch(
    loadModulesSchema({
      [code]: {
        manifestLocation: `/apps/${code}/fed-mods.json`,
        modules: [
          {
            id: code,
            module: './RootApp',
            routes: [`/${code}`],
          } as RemoteModule,
        ],
      },
    })
  );

  const Component = () => (
    <LibtJWTContext.Provider
      value={
        {
          initPromise: Promise.resolve(),
          jwt: {
            getUserInfo: () => Promise.resolve(),
            getEncodedToken: () => '',
          },
        } as LibJWT
      }
    >
      <MemoryRouter initialEntries={[`/${code}`]}>
        <Provider store={reduxStore}>
          <IntlProvider locale="en">
            <FeatureFlagsProvider>
              <ScalprumRoot
                helpTopicsAPI={{
                  addHelpTopics: () => undefined,
                  disableTopics: () => undefined,
                  enableTopics: () => Promise.resolve([]),
                }}
                quickstartsAPI={{
                  Catalog: () => null,
                  set: () => undefined,
                  toggle: () => undefined,
                  updateQuickStarts: () => undefined,
                  version: 1,
                }}
                config={{
                  [code]: {
                    manifestLocation: `/apps/${code}/fed-mods.json`,
                    name: code,
                    module: `${code}#./RootApp`,
                  } as AppMetadata,
                }}
              />
            </FeatureFlagsProvider>
          </IntlProvider>
        </Provider>
      </MemoryRouter>
    </LibtJWTContext.Provider>
  );
  return Component;
}

describe('Gateway errors', () => {
  after(() => {
    window.localStorage.removeItem(BLOCK_CLEAR_GATEWAY_ERROR);
  });
  beforeEach(() => {
    window.localStorage.setItem(BLOCK_CLEAR_GATEWAY_ERROR, 'true');
    cy.intercept('GET', '/api/featureflags/*', { toggles: [] });
    cy.intercept('POST', '/api/featureflags/v0/client/*', {});
    cy.intercept('GET', '/config/chrome/*-navigation.json?ts=*', {
      navItems: [],
    });
    // clear the instance
    removeScalprum();
  });

  it('handles 403 3scale gateway error', () => {
    const code = 'gateway-403';
    const Component = createEnv(code);
    cy.window().then((win) => {
      win[code] = {
        init: () => undefined,
        get: () => () => ({
          default: () => <div>{code}</div>,
        }),
      };
    });
    // throw 403 gateway error
    cy.intercept('GET', `/apps/${code}/fed-mods.json`, {
      statusCode: 403,
      body: {
        errors: [
          {
            status: 403,
            detail: 'Gateway has thrown an 403 error',
            meta: {
              response_by: 'gateway',
            },
          },
        ],
      },
    }).as('fedMods');
    cy.mount(<Component />);

    cy.wait('@fedMods');

    cy.contains(`You do not have access to ${code}`).should('exist');
    cy.contains('Detail: Gateway has thrown an 403 error.').should('exist');
  });

  COMPLIACE_ERROR_CODES.forEach((code, index) => {
    it(`handles compliance ${code} gateway error`, () => {
      const moduleName = `module${index}`;
      removeScalprum();
      window[moduleName] = {
        init: () => undefined,
        get: () => () => ({
          // eslint-disable-next-line react/display-name
          default: () => {
            return (
              <div>
                <button onClick={() => fetch(`/${code}/bar`)}>Force API call</button>
              </div>
            );
          },
        }),
      };
      const Component = createEnv(moduleName);
      cy.intercept(`/apps/${code}/bar.js*`, {});
      cy.intercept('GET', `/apps/${moduleName}/fed-mods.json`, {
        statusCode: 200,
        body: {
          [moduleName]: {
            entry: [`/apps/${code}/bar.js`],
          },
        },
      }).as(`${code}-string`);

      cy.intercept('GET', `/${code}/bar`, {
        statusCode: 403,
        Headers: {
          'content-type': 'application/json',
        },
        body: {
          errors: [
            {
              status: 403,
              detail: `Gateway has thrown ${code} compliance error`,
              meta: {
                response_by: 'gateway',
              },
            },
          ],
        },
      }).as(`${code}-call`);

      cy.mount(<Component />);

      cy.wait(`@${code}-string`);
      cy.contains('Force API call').click();
      cy.wait(`@${code}-call`);
      cy.contains(code).should('exist');
      cy.contains(`Gateway has thrown ${code} compliance error`).should('exist');
    });
  });

  COMPLIACE_ERROR_CODES.forEach((code, index) => {
    it(`handles compliance ${code} string error`, () => {
      const moduleName = `module${index}`;
      removeScalprum();
      window[moduleName] = {
        init: () => undefined,
        get: () => () => ({
          // eslint-disable-next-line react/display-name
          default: () => {
            return (
              <div>
                <button onClick={() => fetch(`/${code}/bar`)}>Force API call</button>
              </div>
            );
          },
        }),
      };
      cy.on('uncaught:exception', () => {
        // runtime exception is expected
        return false;
      });
      const Component = createEnv(moduleName);
      cy.intercept(`/apps/${code}/bar.js*`, {});
      cy.intercept('GET', `/apps/${moduleName}/fed-mods.json`, {
        statusCode: 200,
        body: {
          [moduleName]: {
            entry: [`/apps/${code}/bar.js`],
          },
        },
      }).as(`${code}-string`);

      cy.intercept('GET', `/${code}/bar`, {
        statusCode: 403,
        Headers: {
          'content-type': 'text/plain',
        },
        body: `Gateway has thrown ${code} compliance error`,
      }).as(`${code}-call`);

      cy.mount(<Component />);

      cy.wait(`@${code}-string`);
      cy.contains('Force API call').click();
      cy.wait(`@${code}-call`);
      cy.contains(code).should('exist');
      cy.contains(`Gateway has thrown ${code} compliance error`).should('exist');
    });
  });

  it('should render component if a 403 error does not originate from gateway', () => {
    const code = 'not-gateway-403';
    // make sure to mock the JS modle asset
    cy.intercept('/apps/foo/bar.js*', {});
    const Component = createEnv(code);
    // mock the module
    window[code] = {
      init: () => undefined,
      get: () => () => ({
        // eslint-disable-next-line react/display-name
        default: () => {
          const [err, setErr] = useState(false);

          return (
            <div>
              {err ? <h1>Component error handler</h1> : <h1>Normal render</h1>}
              <button onClick={() => fetch('/foo/bar').then(() => setErr(true))}>Force API call</button>
            </div>
          );
        },
      }),
    };
    cy.intercept('GET', `/apps/${code}/fed-mods.json`, {
      statusCode: 200,
      body: {
        [code]: {
          entry: ['/apps/foo/bar.js'],
        },
      },
    }).as(code);
    // throw 403 gateway error
    cy.intercept('GET', `/foo/bar`, {
      statusCode: 403,
      body: {
        errors: [
          {
            status: 403,
            detail: 'Aome API error',
          },
        ],
      },
    }).as(code);
    cy.mount(<Component />);
    cy.contains(`Normal render`).should('exist');
    cy.contains(`Component error handler`).should('not.exist');

    cy.contains('Force API call').click();
    cy.wait(`@${code}`);

    cy.contains(`Normal render`).should('not.exist');
    cy.contains(`Component error handler`).should('exist');
  });

  it('does not handle 404 3scale gateway error', () => {
    const code = 'gateway-404';
    cy.intercept('/apps/foo/bar.js*', {});
    const Component = createEnv(code);

    // mock the module
    window[code] = {
      init: () => undefined,
      get: () => () => ({
        // eslint-disable-next-line react/display-name
        default: () => {
          const [err, setErr] = useState(false);

          return (
            <div>
              {err ? <h1>Component error handler</h1> : <h1>Normal render</h1>}
              <button onClick={() => fetch('/foo/bar').then(() => setErr(true))}>Force API call</button>
            </div>
          );
        },
      }),
    };
    // throw 403 gateway error
    cy.intercept('GET', `/apps/${code}/fed-mods.json`, {
      statusCode: 200,
      body: {
        [code]: {
          entry: ['/apps/foo/bar.js'],
        },
      },
    }).as(code);
    cy.mount(<Component />);
    cy.contains(`Normal render`).should('exist');
    cy.contains(`Component error handler`).should('not.exist');

    cy.contains('Force API call').click();
    cy.wait(`@${code}`);

    cy.contains(`Normal render`).should('not.exist');
    cy.contains(`Component error handler`).should('exist');
  });
});
