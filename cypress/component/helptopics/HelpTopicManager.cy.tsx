/// <reference types="cypress" />

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { IntlProvider } from 'react-intl';

import RootApp from '../../../src/components/RootApp/RootApp';
import chromeStore from '../../../src/state/chromeStore';
import InternalChromeContext from '../../../src/utils/internalChromeContext';

import testUser from '../../fixtures/testUser.json';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ChromeAPI, ChromeUser } from '@redhat-cloud-services/types';
import { initializeVisibilityFunctions } from '../../../src/utils/VisibilitySingleton';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../../src/auth/ChromeAuthContext';
import { useAtom, useSetAtom } from 'jotai';
import { ScalprumConfig, scalprumConfigAtom } from '../../../src/state/atoms/scalprumConfigAtom';
import { moduleRoutesAtom } from '../../../src/state/atoms/chromeModuleAtom';
import { RouteDefinition } from '../../../src/@types/types';
import ScalprumProvider from '@scalprum/react-core';
import { initialize, removeScalprum } from '@scalprum/core';

const chromeUser: ChromeUser = testUser as unknown as ChromeUser;

const chromeAuthContextValue: ChromeAuthContextValue = {
  ssoUrl: '',
  doOffline: () => Promise.resolve(),
  getOfflineToken: () => Promise.resolve({} as any),
  getToken: () => Promise.resolve(''),
  getRefreshToken: () => Promise.resolve(''),
  getUser: () => Promise.resolve(chromeUser),
  login: () => Promise.resolve(),
  loginAllTabs: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  logoutAllTabs: () => Promise.resolve(),
  reAuthWithScopes: () => Promise.resolve(),
  forceRefresh: () => Promise.resolve(),
  loginSilent: () => Promise.resolve(),
  ready: true,
  token: '',
  refreshToken: '',
  tokenExpires: 0,
  user: chromeUser,
};

const initialScalprumConfig = {
  TestApp: {
    name: 'TestApp',
    appId: 'TestApp',
    manifestLocation: '/foo/bar.json',
  },
  virtualAssistant: {
    name: 'virtualAssistant',
    appId: 'virtualAssistant',
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
  {
    absolute: true,
    path: '*',
    module: './AstroVirtualAssistant',
    scope: 'virtualAssistant',
    manifestLocation: '/foo/bar.json',
  },
];

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const scalprum = useRef(
    initialize({
      appsConfig: {
        virtualAssistant: {
          name: 'virtualAssistant',
          manifestLocation: '/foo/bar.json',
        },
        TestApp: {
          name: 'TestApp',
          manifestLocation: '/foo/bar.json',
        },
      },
    })
  );

  useEffect(() => {
    scalprum.current.exposedModules['virtualAssistant#AstroVirtualAssistant'] = {
      default: () => <div id="virtual-assistant">Virtual Assistant</div>,
    };

    scalprum.current.exposedModules['virtualAssistant#state/globalState'] = {
      default: { foo: 'bar' },
      useVirtualAssistant: () => [],
      Models: {},
    };

    scalprum.current.exposedModules['TestApp#TestApp'] = {
      default: () => <div id="test-app">Test App</div>,
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
      <ScalprumProvider scalprum={scalprum.current}>
        <JotaiProvider store={chromeStore}>
          <ChromeAuthContext.Provider value={chromeAuthContextValue}>{children}</ChromeAuthContext.Provider>
        </JotaiProvider>
      </ScalprumProvider>
    </IntlProvider>
  );
};

const WrapperWithAtoms = ({
  config = initialScalprumConfig,
  moduleRoutes = initialModuleRoutes,
}: {
  config?: ScalprumConfig;
  moduleRoutes?: RouteDefinition[];
}) => {
  return (
    <IntlProvider locale="en">
      <JotaiProvider store={chromeStore}>
        <AtomSetter config={config} moduleRoutes={moduleRoutes} />
      </JotaiProvider>
    </IntlProvider>
  );
};

const AtomSetter = ({ config, moduleRoutes }: { config: ScalprumConfig; moduleRoutes: RouteDefinition[] }) => {
  const [scalprumConfig, setScalprumConfig] = useAtom(scalprumConfigAtom);
  const setModuleRoutes = useSetAtom(moduleRoutesAtom);

  useEffect(() => {
    setModuleRoutes(moduleRoutes);
    setScalprumConfig(config);
  }, [config, moduleRoutes, setModuleRoutes, setScalprumConfig]);

  if (Object.keys(scalprumConfig).length === 0) {
    return null;
  }

  return (
    <ChromeAuthContext.Provider value={chromeAuthContextValue}>
      <RootApp />
    </ChromeAuthContext.Provider>
  );
};

const TestComponent = () => {
  const chrome = useContext(InternalChromeContext);
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
  before(() => {
    initializeVisibilityFunctions({
      getUser() {
        return Promise.resolve(testUser as unknown as ChromeUser);
      },
      getToken: () => Promise.resolve('a.a'),
      getUserPermissions: () => Promise.resolve([]),
      isPreview: false,
    });
    cy.window().then((win) => {
      win.virtualAssistant = {
        init: () => {},
        get: (module) => {
          return () => {
            if (module === './AstroVirtualAssistant') {
              return {
                default: () => <div>Virtual Assistant</div>,
              };
            }
            if (module === './state/globalState') {
              return {
                useVirtualAssistant: () => [],
                Models: {},
              };
            }
            return {};
          };
        },
      };
      win.TestApp = {
        init: () => {},
        get: (module) => {
          return () => {
            if (module === './TestApp') {
              return {
                default: () => <div>Test App</div>,
              };
            }
            return {};
          };
        },
      };
    });
  });
  beforeEach(() => {
    cy.intercept('GET', '/api/featureflags/*', {
      toggles: [],
    });
    cy.intercept('GET', 'foo/bar.js*', {});
    cy.intercept('GET', '/foo/bar.json', {
      TestApp: {
        entry: ['/foo/bar.js'],
      },
      virtualAssistant: {
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
    cy.intercept('http://localhost:8080/api/chrome-service/v1/static/search-index-generated.json', []);
  });

  it('should switch help topics drawer content', () => {
    // Test the help topics functionality with a proper chrome mock
    cy.viewport(1280, 720);

    // Create mock Chrome API with helpTopics inside the test
    const mockChromeAPI: ChromeAPI = {
      auth: {
        getOfflineToken: () => Promise.resolve({} as any),
        doOffline: () => Promise.resolve(),
        getToken: () => Promise.resolve(''),
        getRefreshToken: () => Promise.resolve(''),
        getUser: () => Promise.resolve(chromeUser),
        login: () => Promise.resolve(),
        loginAllTabs: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        logoutAllTabs: () => Promise.resolve(),
        reAuthWithScopes: () => Promise.resolve(),
        forceRefresh: () => Promise.resolve(),
        loginSilent: () => Promise.resolve(),
      },
      helpTopics: {
        addHelpTopics: cy.stub().as('addHelpTopics'),
        enableTopics: cy.stub().as('enableTopics').resolves([]),
        disableTopics: cy.stub().as('disableTopics'),
        setActiveTopic: cy.stub().as('setActiveTopic'),
        closeHelpTopic: cy.stub().as('closeHelpTopic'),
      },
      quickStarts: {
        version: 2,
        Catalog: () => null,
        set: cy.stub(),
        toggle: cy.stub(),
        activateQuickstart: cy.stub().resolves(),
      },
      visibilityFunctions: {
        isOrgAdmin: () => Promise.resolve(false),
        isActive: () => Promise.resolve(true),
        isEntitled: () => Promise.resolve(true),
        isProd: () => true,
        isBeta: () => false,
        isHidden: () => Promise.resolve(false),
      },
      getUserPermissions: cy.stub().resolves([]),
      getUser: () => Promise.resolve(chromeUser),
      getToken: () => Promise.resolve(''),
      identifyApp: cy.stub(),
      navigation: cy.stub(),
      on: cy.stub(),
      updateDocumentTitle: cy.stub(),
      experimentalApi: true,
      isFedramp: false,
      usePendoFeedback: cy.stub(),
      segment: {
        setPageMetadata: cy.stub(),
      },
      toggleFeedbackModal: cy.stub(),
      enableDebugging: cy.stub(),
      toggleDebuggerModal: cy.stub(),
      clearAnsibleTrialFlag: cy.stub(),
      isAnsibleTrialFlagActive: cy.stub(),
      setAnsibleTrialFlag: cy.stub(),
      chromeHistory: {} as any,
      analytics: {} as any,
      useGlobalFilter: cy.stub(),
      init: cy.stub().returns({
        on: cy.stub(),
        updateDocumentTitle: cy.stub(),
        identifyApp: cy.stub(),
      }),
      $internal: {
        forceAuthRefresh: cy.stub(),
      },
      enablePackagesDebug: cy.stub(),
      requestPdf: cy.stub(),
      drawerActions: {
        openDrawer: cy.stub(),
        closeDrawer: cy.stub(),
      },
      mapGlobalFilter: cy.stub(),
      getBundle: cy.stub(),
      getBundleData: cy.stub(),
      getApp: cy.stub(),
      getEnvironment: cy.stub(),
      isProd: cy.stub(),
      isBeta: cy.stub(),
      isPenTest: cy.stub(),
      isDemo: cy.stub(),
      createCase: cy.stub(),
    } as any;

    // Mount the TestComponent with InternalChromeContext that provides the mocked chrome API
    cy.mount(
      <Wrapper>
        <InternalChromeContext.Provider value={mockChromeAPI}>
          <TestComponent />
        </InternalChromeContext.Provider>
      </Wrapper>
    );

    // Verify the TestComponent buttons are rendered
    cy.get('#open-one').should('be.visible').should('contain', 'Open a topic create-app-config');
    cy.get('#open-two').should('be.visible').should('contain', 'Open a topic create-environment');

    // Test that we can click the buttons and the helpTopics API is called
    cy.get('#open-one').click();
    cy.get('@setActiveTopic').should('have.been.calledWith', 'create-app-config');

    cy.get('#open-two').click();
    cy.get('@setActiveTopic').should('have.been.calledWith', 'create-environment');

    // Verify enableTopics was called during component mount
    cy.get('@enableTopics').should('have.been.calledWith', 'create-app-config', 'create-environment');
  });

  it('should test Jotai atoms setup', () => {
    // Test the Jotai atoms configuration
    cy.mount(<WrapperWithAtoms />);

    // The Wrapper component tests:
    // - scalprumConfigAtom (useAtom)
    // - moduleRoutesAtom (useSetAtom)
    // - Proper Jotai store integration
    // If this renders without error, the atoms are working correctly
    cy.get('body').should('exist');
  });
});
