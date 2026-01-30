import React from 'react';

import { IntlProvider } from 'react-intl';
import CrossRequestNotifier from '../../../src/components/CrossRequestNotifier/CrossRequestNotifier';
import ChromeAuthContext from '../../../src/auth/ChromeAuthContext';
import { AccessRequest } from '../../../src/state/atoms/accessRequestsAtom';
import { BrowserRouter } from 'react-router-dom';

const Wrapper = () => (
  <BrowserRouter>
    <IntlProvider locale="en">
      <ChromeAuthContext.Provider
        value={
          {
            user: {
              entitlements: {},
              identity: {
                org_id: 'foo',
                type: 'User',
                user: {
                  email: 'foo',
                  first_name: 'foo',
                  last_name: 'bar',
                  is_active: true,
                  is_internal: true,
                  locale: 'en',
                  username: 'foo',
                  is_org_admin: true,
                },
              },
            },
          } as any
        }
      >
        <CrossRequestNotifier />
      </ChromeAuthContext.Provider>
    </IntlProvider>
  </BrowserRouter>
);

describe('<CrossRequestNotifier />', () => {
  const sampleAccessRequest: AccessRequest = {
    request_id: 'foo',
    seen: false,
    created: '2021-08-10T14:00:00.000Z',
  };

  it('Should show alert about unread access request', () => {
    cy.intercept('GET', '/api/rbac/v1/cross-account-requests/?limit=10&status=pending&order_by=-created', {
      statusCode: 200,
      body: {
        data: [sampleAccessRequest] as AccessRequest[],
        meta: {
          count: 1,
        },
      },
    });
    cy.mount(<Wrapper />);
    cy.contains('View request').should('exist');
  });

  it('Should not show alert about read access request', () => {
    cy.intercept('GET', '/api/rbac/v1/cross-account-requests/?limit=10&status=pending&order_by=-created', {
      statusCode: 200,
      body: {
        data: [{ ...sampleAccessRequest, seen: false }] as AccessRequest[],
        meta: {
          count: 1,
        },
      },
    });
    cy.mount(<Wrapper />);
    cy.contains('View request').should('not.exist');
  });

  it('Should show only one alert even if mulple access reqeusts are available', () => {
    cy.intercept('GET', '/api/rbac/v1/cross-account-requests/?limit=10&status=pending&order_by=-created', {
      statusCode: 200,
      body: {
        data: [sampleAccessRequest, sampleAccessRequest] as AccessRequest[],
        meta: {
          count: 1,
        },
      },
    });
    cy.mount(<Wrapper />);
    cy.contains('View request').should('have.length', 1);
  });

  it('Should close alert after clicking on the clsoe button', () => {
    cy.intercept('GET', '/api/rbac/v1/cross-account-requests/?limit=10&status=pending&order_by=-created', {
      statusCode: 200,
      body: {
        data: [sampleAccessRequest] as AccessRequest[],
        meta: {
          count: 1,
        },
      },
    });
    cy.mount(<Wrapper />);
    cy.contains('View request').should('exist');
    cy.get('.pf-v6-c-alert__action').click();
    cy.contains('View request').should('not.exist');
  });

  it('Alert should disaapear after 10s', () => {
    cy.intercept('GET', '/api/rbac/v1/cross-account-requests/?limit=10&status=pending&order_by=-created', {
      statusCode: 200,
      body: {
        data: [sampleAccessRequest] as AccessRequest[],
        meta: {
          count: 1,
        },
      },
    });
    cy.mount(<Wrapper />);
    cy.contains('View request').should('exist');
    cy.wait(10001);
    cy.contains('View request').should('not.exist');
  });

  it.only('Should show new alert after polling sends new data.', () => {
    let requests = 0;
    cy.intercept('GET', '/api/rbac/v1/cross-account-requests/?limit=10&status=pending&order_by=-created', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          data:
            requests > 0
              ? [
                  { ...sampleAccessRequest, seen: true },
                  { ...sampleAccessRequest, seen: false, request_id: 'bar' },
                ]
              : [{ ...sampleAccessRequest, seen: true }],
          meta: {
            count: 1,
          },
        },
      });
      requests += 1;
    }).as('pollRequest');
    cy.mount(<Wrapper />);
    cy.wait('@pollRequest');
    cy.contains('View request').should('not.exist');
    // wait for the polling to fetch new data
    cy.wait('@pollRequest', { timeout: 50000 });
    cy.contains('View request').should('exist');
  });
});
