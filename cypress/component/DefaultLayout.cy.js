import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import { ScalprumProvider } from '@scalprum/react-core';
import { initialize, removeScalprum } from '@scalprum/core';
import DefaultLayout from '../../src/layouts/DefaultLayout';
import { Nav } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import ChromeNavItem from '../../src/components/Navigation/ChromeNavItem';
import { IntlProvider } from 'react-intl';
import { FeatureFlagsProvider } from '../../src/components/FeatureFlags';
import Footer from '../../src/components/Footer/Footer';
import ChromeAuthContext from '../../src/auth/ChromeAuthContext';
import chromeStore from '../../src/state/chromeStore';
import InternalChromeContext from '../../src/utils/internalChromeContext';

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

const mockInternalChromeContext = {
  drawerActions: {
    toggleDrawerContent: () => {
      console.log('mock: toggleDrawerContent called');
    },
  },
};

const Wrapper = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const scalprum = useRef(
    initialize({
      appsConfig: {
        virtualAssistant: {
          name: 'virtualAssistant',
          manifestLocation: '/foo/bar.json',
        },
      },
    })
  );

  useEffect(() => {
    scalprum.current.exposedModules['virtualAssistant#./AstroVirtualAssistant'] = {
      default: () => <div id="virtual-assistant">Virtual Assistant</div>,
    };

    // Mock the state/globalState module (without ./ prefix)
    scalprum.current.exposedModules['virtualAssistant#state/globalState'] = {
      default: { foo: 'bar' },
      useVirtualAssistant: () => [],
      Models: {},
    };

    setIsReady(true);
    return () => {
      removeScalprum();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <IntlProvider locale="en">
      <ChromeAuthContext.Provider value={chromeAuthContextValue}>
        <InternalChromeContext.Provider value={mockInternalChromeContext}>
          <ScalprumProvider scalprum={scalprum.current}>
            <JotaiProvider store={chromeStore}>
              <FeatureFlagsProvider>
                <BrowserRouter>{children}</BrowserRouter>
              </FeatureFlagsProvider>
            </JotaiProvider>
          </ScalprumProvider>
        </InternalChromeContext.Provider>
      </ChromeAuthContext.Provider>
    </IntlProvider>
  );
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
  before(() => {
    cy.window().then((win) => {
      win.virtualAssistant = {
        init: () => {},
        get: () => () => ({
          default: () => <div>Virtual Assistant</div>,
        }),
      };
    });
  });

  beforeEach(() => {
    cy.intercept('PUT', 'http://localhost:8080/api/notifications/v1/notifications/drawer/read', {
      statusCode: 200,
    });
    cy.intercept('GET', '/api/featureflags/*', {
      toggles: [
        {
          // until the bredcrumbs are enabled by default
          name: 'platform.chrome.bredcrumbs.enabled',
          enabled: true,
          variant: { name: 'disabled', enabled: true },
        },
      ],
    });
    cy.intercept('POST', '/api/featureflags/v0/client/metrics', {});
    cy.intercept('GET', '/config/chrome/*-navigation.json*', {
      navItems: [],
    });
    cy.intercept('GET', '/api/chrome-service/v1/static/stable/stage/services/services-generated.json', []);
    cy.intercept('GET', '/api/chrome-service/v1/static/stable/stage/search/search-index.json', []);
    cy.intercept('GET', '/api/chrome-service/v1/static/search-index-generated.json', []);

    cy.intercept('GET', 'foo/bar.js*', {});
    cy.intercept('GET', '/foo/bar.json', {
      TestApp: {
        entry: ['/foo/bar.js'],
      },
      virtualAssistant: {
        entry: ['/foo/bar.js'],
      },
    }).as('manifest');
  });

  it('render correctly with few nav items', () => {
    // Should not see a nav scrollbar
    cy.viewport(1280, 720);
    cy.intercept('http://localhost:8080/api/rbac/v1/cross-account-requests/?status=approved&order_by=-created&query_by=user_id', {
      data: [],
    });
    cy.intercept('GET', '/api/chrome-service/v1/static/stable/stage/navigation/*-navigation.json', {
      navItems: [...Array(5)],
    }).as('navRequest');
    const elem = cy
      .mount(
        <Wrapper>
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
    cy.intercept('GET', '/api/chrome-service/v1/static/stable/stage/navigation/*-navigation.json', {
      navItems: [...Array(30)],
    }).as('navRequest');
    const elem = cy
      .mount(
        <Wrapper>
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
    cy.intercept('GET', '/api/chrome-service/v1/static/stable/stage/navigation/*-navigation.json', {
      navItems: [...Array(5)],
    }).as('navRequest');
    const elem = cy
      .mount(
        <Wrapper>
          <DefaultLayout Sidebar={SidebarMock} Footer={Footer} />
        </Wrapper>
      )
      .get('html');
    cy.wait('@navRequest');
    elem.get('body').matchImageSnapshot();
  });
});
