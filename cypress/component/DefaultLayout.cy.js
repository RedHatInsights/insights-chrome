import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ScalprumProvider } from '@scalprum/react-core';
import chromeReducer, { chromeInitialState } from '../../src/js/redux';
import DefaultLayout from '../../src/js/App/RootApp/DefaultLayout';
import ReducerRegistry from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import { Nav, NavList } from '@patternfly/react-core';
import ChromeNavItem from '../../src/js/App/Sidenav/Navigation/ChromeNavItem';

const Wrapper = ({ children, store }) => (
  <ScalprumProvider config={{}}>
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  </ScalprumProvider>
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

const SidebarMock = ({ items = 5 }) => (
  <Nav>
    <NavList>
      {[...Array(items)].map((_, i) => (
        <ChromeNavItem title={`Nav item no: ${i}`} href="#" key={i} />
      ))}
    </NavList>
  </Nav>
);
describe('<Default layout />', () => {
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

  it('render correctly with few nav items', () => {
    // Should not see a nav scrollbar
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });
    const elem = cy
      .mount(
        <Wrapper store={store}>
          <DefaultLayout Sidebar={<SidebarMock />} />
        </Wrapper>
      )
      .get('html');
    elem.matchImageSnapshot();
  });

  it('render correctly with many nav items', () => {
    // Should see a nav scrollbar
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });
    const elem = cy
      .mount(
        <Wrapper store={store}>
          <DefaultLayout Sidebar={<SidebarMock items={30} />} />
        </Wrapper>
      )
      .get('html');
    elem.matchImageSnapshot();
  });
});
