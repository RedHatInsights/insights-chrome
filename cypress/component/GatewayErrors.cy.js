import React, { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import logger from 'redux-logger';

import ScalprumRoot from '../../src/components/RootApp/ScalprumRoot';
import chromeReducer from '../../src/redux';
import { FeatureFlagsProvider } from '../../src/components/FeatureFlags';
import { loadModulesSchema } from '../../src/redux/actions';
import qe from '../../src/utils/iqeEnablement';
import { COMPLIACE_ERROR_CODES } from '../../src/utils/responseInterceptors';

function createEnv(code) {
  if (!code) {
    throw 'Enviroment must have identifier';
  }
  const reduxStore = createStore(combineReducers(chromeReducer()), applyMiddleware(logger));
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
          },
        ],
      },
    })
  );

  const Component = () => (
    <MemoryRouter initialEntries={[`/${code}`]}>
      <Provider store={reduxStore}>
        <IntlProvider locale="en">
          <FeatureFlagsProvider>
            <ScalprumRoot
              config={{
                [code]: {
                  manifestLocation: `/apps/${code}/fed-mods.json`,
                  name: code,
                  module: `${code}#./RootApp`,
                },
              }}
            />
          </FeatureFlagsProvider>
        </IntlProvider>
      </Provider>
    </MemoryRouter>
  );

  return Component;
}

describe('Gateway errors', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/featureflags/*', { toggles: [] });
    cy.intercept('POST', '/api/featureflags/v0/client/*', {});
    window.__scalprum__ === undefined;
  });

  it('handles 403 3scale gateway error', () => {
    const code = 'gateway-403';
    const Component = createEnv(code);
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

  COMPLIACE_ERROR_CODES.forEach((code) => {
    it(`handles compliance ${code} gateway error`, () => {
      const Component = createEnv(code);
      // throw 403 gateway error with compliance error response
      cy.intercept('GET', `/apps/${code}/fed-mods.json`, {
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
      }).as(code);

      cy.mount(<Component />);

      cy.wait(`@${code}`);

      cy.contains(code).should('exist');
      cy.contains(`Gateway has thrown ${code} compliance error`).should('exist');
    });
  });

  COMPLIACE_ERROR_CODES.forEach((code) => {
    it(`handles compliance ${code} string error`, () => {
      const Component = createEnv(code);
      // throw 403 string error with compliance error code
      cy.intercept('GET', `/apps/${code}/fed-mods.json`, {
        statusCode: 403,
        Headers: {
          'content-type': 'text/plain',
        },
        body: `Gateway has thrown ${code} compliance error`,
      }).as(`${code}-string`);

      cy.mount(<Component />);

      cy.wait(`@${code}-string`);

      cy.contains(code).should('exist');
      cy.contains(`Gateway has thrown ${code} compliance error`).should('exist');
    });
  });

  it('should render component if a 403 error does not originate from gateway', () => {
    const code = 'not-gateway-403';
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
      body: {},
    }).as(code);
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
      statusCode: 404,
      body: {
        errors: [
          {
            status: 404,
            detail: 'Gateway has thrown an 403 error',
            meta: {
              response_by: 'gateway',
            },
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
});
