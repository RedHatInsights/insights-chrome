import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ScalprumProvider } from '@scalprum/react-core';
import chromeReducer, { chromeInitialState } from '../../src/redux';
import DefaultLayout from '../../src/layouts/DefaultLayout';
import ReducerRegistry from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import { Nav, NavList } from '@patternfly/react-core';
import ChromeNavItem from '../../src/components/Navigation/ChromeNavItem';
import { IntlProvider } from 'react-intl';
import { FeatureFlagsProvider } from '../../src/components/FeatureFlags';
import Footer from '../../src/components/Footer/Footer';

const Wrapper = ({ children, store }) => (
  <IntlProvider locale="en">
    <ScalprumProvider config={{}}>
      <Provider store={store}>
        <FeatureFlagsProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </FeatureFlagsProvider>
      </Provider>
    </ScalprumProvider>
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

const SidebarMock = ({ loaded, schema: { navItems: items } = {} }) => {
  if (!loaded) {
    return null;
  }
  return (
    <Nav>
      <NavList>
        {items.map((_, i) => (
          <ChromeNavItem title={`Nav item no: ${i}`} href="#" key={i} />
        ))}
      </NavList>
    </Nav>
  );
};

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
    cy.intercept('GET', '/api/featureflags/*', {
      toggles: [],
    });
    cy.intercept('POST', '/api/featureflags/v0/client/metrics', {});
  });

  it('render correctly with few nav items', () => {
    // Should not see a nav scrollbar
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });
    cy.intercept('GET', '/config/chrome/__cypress-navigation.json?ts=*', {
      navItems: [...Array(5)],
    }).as('navRequest');
    const elem = cy
      .mount(
        <Wrapper store={store}>
          <DefaultLayout Sidebar={SidebarMock} />
        </Wrapper>
      )
      .get('html');
    cy.wait('@navRequest');
    elem.get('body').matchImageSnapshot();
  });

  it('render correctly with many nav items', () => {
    // Should see a nav scrollbar
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });

    cy.intercept('GET', '/config/chrome/__cypress-navigation.json?ts=*', {
      navItems: [...Array(30)],
    }).as('navRequest');
    const elem = cy
      .mount(
        <Wrapper store={store}>
          <DefaultLayout Sidebar={SidebarMock} />
        </Wrapper>
      )
      .get('html');
    cy.wait('@navRequest');
    elem.get('body').matchImageSnapshot();
  });

  it('render with footer at the screen bottom', () => {
    // footer should stick to the bottom of the page
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });

    cy.intercept('GET', '/config/chrome/__cypress-navigation.json?ts=*', {
      navItems: [...Array(5)],
    }).as('navRequest');
    const elem = cy
      .mount(
        <Wrapper store={store}>
          <DefaultLayout Sidebar={SidebarMock} Footer={Footer} />
        </Wrapper>
      )
      .get('html');
    cy.wait('@navRequest');

    elem.get('body').matchImageSnapshot();
  });
});
