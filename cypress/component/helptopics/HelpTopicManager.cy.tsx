/// <reference types="cypress" />

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { AnyAction, Store } from 'redux';
import ReducerRegistry from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { IntlProvider } from 'react-intl';

import RootApp from '../../../src/components/RootApp/RootApp';
import chromeReducer, { chromeInitialState } from '../../../src/redux';

import testUser from '../../fixtures/testUser.json';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ChromeUser } from '@redhat-cloud-services/types';
import { initializeVisibilityFunctions } from '../../../src/utils/VisibilitySingleton';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../../src/auth/ChromeAuthContext';
import { useAtom, useSetAtom } from 'jotai';
import { ScalprumConfig, scalprumConfigAtom } from '../../../src/state/atoms/scalprumConfigAtom';
import { moduleRoutesAtom } from '../../../src/state/atoms/chromeModuleAtom';
import { RouteDefinition } from '../../../src/@types/types';

const chromeUser: ChromeUser = testUser as unknown as ChromeUser;

const chromeAuthContextValue: ChromeAuthContextValue = {
  doOffline: () => Promise.resolve(),
  getOfflineToken: () => Promise.resolve({} as any),
  getToken: () => Promise.resolve(''),
  getUser: () => Promise.resolve(chromeUser),
  login: () => Promise.resolve(),
  loginAllTabs: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  logoutAllTabs: () => Promise.resolve(),
  ready: true,
  token: '',
  tokenExpires: 0,
  user: chromeUser,
};

const initialScalprumConfig = {
  TestApp: {
    name: 'TestApp',
    appId: 'TestApp',
    manifestLocation: '/foo/bar.json',
  },
};

const initialModuleRoutes = [
  {
    absolute: true,
    path: '*',
    module: './TestApp',
    scope: 'TestApp',
    manifestLocation: '/foo/bar.json',
  },
];

const Wrapper = ({
  store,
  config = initialScalprumConfig,
  moduleRoutes = initialModuleRoutes,
}: {
  store: Store;
  config?: ScalprumConfig;
  moduleRoutes?: RouteDefinition[];
}) => {
  const [scalprumConfig, setScalprumConfig] = useAtom(scalprumConfigAtom);
  const setModuleRoutes = useSetAtom(moduleRoutesAtom);
  useEffect(() => {
    setModuleRoutes(moduleRoutes);
    setScalprumConfig(config);
  }, []);
  if (Object.keys(scalprumConfig).length === 0) {
    return null;
  }

  return (
    <IntlProvider locale="en">
      <Provider store={store}>
        <ChromeAuthContext.Provider value={chromeAuthContextValue}>
          <RootApp setCookieElement={() => undefined} cookieElement={null} />
        </ChromeAuthContext.Provider>
      </Provider>
    </IntlProvider>
  );
};

const TestComponent = () => {
  const chrome = useChrome();
  useEffect(() => {
    chrome.helpTopics.enableTopics('create-app-config', 'create-environment');
  }, []);
  return (
    <div>
      <Button id="open-one" variant="link" onClick={() => chrome.helpTopics.setActiveTopic('create-app-config')}>
        Open a topic create-app-config
      </Button>
      <Button id="open-two" variant="link" onClick={() => chrome.helpTopics.setActiveTopic('create-environment')}>
        Open a topic create-environment
      </Button>
    </div>
  );
};

describe('HelpTopicManager', () => {
  let store: Store<any, AnyAction>;
  before(() => {
    initializeVisibilityFunctions({
      getUser() {
        return Promise.resolve(testUser as unknown as ChromeUser);
      },
      getToken: () => Promise.resolve('a.a'),
      getUserPermissions: () => Promise.resolve([]),
    });
  });
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
    cy.intercept('GET', 'foo/bar.js*', {});
    cy.intercept('GET', '/foo/bar.json', {
      TestApp: {
        entry: ['/foo/bar.js'],
      },
    }).as('manifest');
    cy.intercept('POST', '/api/featureflags/v0/client/metrics', {});
    cy.intercept('POST', 'https://api.segment.io/v1/*', {});
    cy.intercept('GET', ' /api/rbac/v1/access/?application=inventory&limit=1000', {
      data: [],
    });
    cy.intercept('GET', '/api/quickstarts/v1/progress?account=*', {
      data: [],
    });
    cy.intercept('GET', '/api/quickstarts/v1/*', (req) => {
      if (req.url.includes('/helptopics')) {
        req.reply({ status: 200, fixture: 'helpTopicsResponse.json' });
        return;
      }

      req.reply({ status: 200, body: { data: [] } });
    });
    cy.intercept('POST', '/api/chrome-service/v1/user/visited-bundles', {
      data: [],
    });
    cy.intercept('POST', '/api/chrome-service/v1/last-visited', {
      data: [],
    });
    cy.intercept('GET', '/api/chrome-service/v1/user', {
      data: {
        lastVisited: [],
        favoritePages: [],
        visitedBundles: {},
      },
    });
    cy.intercept('GET', '/api/chrome-service/v1/static/stable/stage/navigation/*-navigation.json?ts=*', {
      navItems: [],
    });
    cy.intercept('GET', '/api/chrome-service/v1/static/stable/stage/services/services-generated.json', []);
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/stable/stage/search/search-index.json', []);
  });

  it('should switch help topics drawer content', () => {
    // change screen size
    cy.viewport(1280, 720);
    cy.window().then((win) => {
      win.TestApp = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        init: () => {},
        get: () => () => ({
          default: TestComponent,
        }),
      };
    });
    // mount element
    cy.mount(<Wrapper store={store}></Wrapper>);
    // open drawer
    cy.get('#open-one').click();
    cy.get(`h1.pf-v6-c-title`).should('be.visible').contains('Configure components');
    // switch from external button
    cy.get('#open-two').click();
    cy.get(`h1.pf-v6-c-title`).should('be.visible').contains('Create a new environment');

    // open help topics context menu
    cy.get('.pfext-quick-start-panel-content__title>button').click();
    cy.get('button.pf-v6-c-menu__item').contains('Automatic Deployment').click();
    cy.get(`h1.pf-v6-c-title`).should('be.visible').contains('Automatic Deployment');

    // switch from external button back to first topic
    cy.get('#open-one').click();
    cy.get(`h1.pf-v6-c-title`).should('be.visible').contains('Configure components');

    // close drawer
    cy.get('div.pfext-quick-start-panel-content__close-button').click();
    cy.get(`h1.pf-v6-c-title`).contains('Configure components').should('not.exist');

    // open second help topic
    cy.get('#open-two').click();
    cy.get(`h1.pf-v6-c-title`).should('be.visible').contains('Create a new environment');
  });
});
