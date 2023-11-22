import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ScalprumProvider } from '@scalprum/react-core';
import chromeReducer, { chromeInitialState } from '../../src/redux';
import ReducerRegistry from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import { IntlProvider } from 'react-intl';
import UserToggle from '../../src/components/Header/UserToggle';
import ChromeAuthContext from '../../src/auth/ChromeAuthContext';

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

const chromeAuthContextValue = {
  doOffline: () => Promise.resolve(),
  getOfflineToken: () => Promise.resolve(),
  getToken: () => Promise.resolve(''),
  getUser: () => Promise.resolve(testUser),
  login: () => Promise.resolve(),
  loginAllTabs: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  logoutAllTabs: () => Promise.resolve(),
  ready: true,
  token: '',
  tokenExpires: 0,
  user: testUser,
};

const Wrapper = ({ children, store }) => (
  <IntlProvider locale="en">
    <ChromeAuthContext.Provider value={chromeAuthContextValue}>
      <ScalprumProvider config={{}}>
        <Provider store={store}>
          <BrowserRouter>{children}</BrowserRouter>
        </Provider>
      </ScalprumProvider>
    </ChromeAuthContext.Provider>
  </IntlProvider>
);

describe('<UserToggle />', () => {
  let store;
  beforeEach(() => {
    const reduxRegistry = new ReducerRegistry({
      ...chromeInitialState,
      chrome: {
        modules: {},
        ...chromeInitialState.chrome,
        user: testUser,
      },
    });
    reduxRegistry.register(chromeReducer());
    store = reduxRegistry.getStore();
  });

  it('render correctly', () => {
    cy.viewport(1280, 720);
    const elem = cy
      .mount(
        <Wrapper store={store}>
          <UserToggle />
        </Wrapper>
      )
      .get('html');
    elem.matchImageSnapshot();
  });

  it('should open toggle', () => {
    cy.viewport(1280, 720);
    cy.mount(
      <Wrapper store={store}>
        <UserToggle />
      </Wrapper>
    ).get('html');
    cy.contains('Log out').should('not.exist');
    cy.contains('john doe').click();
    cy.contains('Log out').should('exist');
  });
});
