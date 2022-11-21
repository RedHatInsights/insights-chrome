import React from 'react';
import { Provider } from 'react-redux';
import chromeReducer, { chromeInitialState } from '../../../src/redux';
import ReducerRegistry from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import { IntlProvider } from 'react-intl';
import ContextSwitcher from '../../../src/components/ContextSwitcher';

const Wrapper = ({ children, store }) => (
  <IntlProvider locale="en">
    <Provider store={store}>{children}</Provider>
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
  let store;
  beforeEach(() => {
    const reduxRegistry = new ReducerRegistry({
      ...chromeInitialState,
      chrome: {
        ...chromeInitialState.chrome,
      },
    });
    reduxRegistry.register(chromeReducer());
    store = reduxRegistry.getStore();
  });

  it('should not fire cross account request for non-internal user', () => {
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });
    const elem = cy
      .mount(
        <Wrapper store={store}>
          <ContextSwitcher user={testUser} />
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
        <Wrapper store={store}>
          <ContextSwitcher user={testUser} />
        </Wrapper>
      )
      .get('html');
    cy.wait('@crossAccountRequests');
    elem.get('body').matchImageSnapshot();
  });
});
