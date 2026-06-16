import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { IntlProvider } from 'react-intl';
import ContextSwitcher from '../../../src/components/ContextSwitcher';
import chromeStore from '../../../src/state/chromeStore';

const Wrapper = ({ children }) => (
  <IntlProvider locale="en">
    <JotaiProvider store={chromeStore}>{children}</JotaiProvider>
  </IntlProvider>
);

const testUser = {
  identity: {
    account_number: '123456',
    org_id: '7890',
    internal: {
      org_id: '7890',
      account_id: '13579',
    },
    type: 'external',
    user: {
      username: 'Extra fella',
      email: 'mail@mail.com',
      first_name: 'john',
      last_name: 'doe',
      is_active: true,
      is_internal: false,
      is_org_admin: false,
      locale: 'en-us',
    },
  },
};

describe('<ContextSwithcer />', () => {
  it('should not fire cross account request for non-internal user', () => {
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });
    const elem = cy
      .mount(
        <Wrapper>
          <ContextSwitcher accountNumber={testUser.identity.account_number} orgId={testUser.identity.org_id} isInternal={testUser.identity.user.is_internal} />
        </Wrapper>
      )
      .get('html');
    elem.matchImageSnapshot();
  });

  it('should fire cross account request for internal user and render component', () => {
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [
        {
          target_account: '111',
          request_id: '111',
          end_date: '2022',
          target_org: '222',
        },
      ],
    }).as('crossAccountRequests');
    testUser.identity.user.is_internal = true;
    const elem = cy
      .mount(
        <Wrapper>
          <ContextSwitcher accountNumber={testUser.identity.account_number} orgId={testUser.identity.org_id} isInternal={testUser.identity.user.is_internal} />
        </Wrapper>
      )
      .get('html');
    cy.wait('@crossAccountRequests');
    elem.get('body').matchImageSnapshot();
  });

  it('should render cross-account entries when API response has no target_account field (RHCLOUD-48475)', () => {
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [
        {
          request_id: 'req-aaa',
          target_org: '17940001',
          start_date: '29 Sep 2025',
          end_date: '28 Sep 2026',
          created: '25 Sep 2025, 13:34 UTC',
          status: 'approved',
          user_id: 'testuser',
          email: 'jdoe@redhat.com',
          first_name: 'Jane',
          last_name: 'Doe',
        },
        {
          request_id: 'req-bbb',
          target_org: '17940002',
          start_date: '11 Aug 2025',
          end_date: '10 Aug 2026',
          created: '08 Aug 2025, 16:52 UTC',
          status: 'approved',
          user_id: 'testuser',
          email: 'jsmith@redhat.com',
          first_name: 'John',
          last_name: 'Smith',
        },
        {
          request_id: 'req-ccc',
          target_org: '17940003',
          start_date: '11 Aug 2025',
          end_date: '10 Aug 2026',
          created: '08 Aug 2025, 16:50 UTC',
          status: 'approved',
          user_id: 'testuser',
          email: 'bob@redhat.com',
          first_name: 'Bob',
          last_name: 'Jones',
        },
      ],
    }).as('crossAccountRequests');

    testUser.identity.user.is_internal = true;
    cy.mount(
      <Wrapper>
        <ContextSwitcher accountNumber={testUser.identity.account_number} orgId={testUser.identity.org_id} isInternal={testUser.identity.user.is_internal} />
      </Wrapper>
    );
    cy.wait('@crossAccountRequests');

    // Component should render
    cy.contains('Account:').should('exist');
    cy.contains('Account:').click();

    // Personal account should show
    cy.contains('123456').should('exist');
    cy.contains('Personal account').should('exist');

    // All 3 cross-account entries should render with org IDs displayed
    cy.get('.account-label').contains('17940001').should('exist');
    cy.get('.account-label').contains('17940002').should('exist');
    cy.get('.account-label').contains('17940003').should('exist');

    // All 3 names should display
    cy.contains('Jane Doe').should('exist');
    cy.contains('John Smith').should('exist');
    cy.contains('Bob Jones').should('exist');
  });
});
