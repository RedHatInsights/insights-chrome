import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ScalprumRoot from './ScalprumRoot';
import { act, render, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../../utils/common', () => {
  const utils = jest.requireActual('../../utils/common');
  return {
    __esModule: true,
    ...utils,
    isBeta: jest.fn().mockReturnValue(false),
    getEnv: jest.fn().mockReturnValue('qa'),
  };
});

jest.mock('react-router-dom', () => {
  const routerDom = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...routerDom,
    useLocation: jest.fn().mockImplementation((...args) => {
      return routerDom.useLocation(...args);
    }),
  };
});

jest.mock('@unleash/proxy-client-react', () => {
  const unleash = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...unleash,
    useFlag: () => false,
    useFlagsStatus: () => ({ flagsReady: true }),
  };
});

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

import * as utils from '../../utils/common';
import * as routerDom from 'react-router-dom';
import LibtJWTContext from '../LibJWTContext';

describe('ScalprumRoot', () => {
  let initialState;
  let mockStore;
  let config;
  const initialProps = {
    helpTopicsAPI: {
      addHelpTopics: jest.fn(),
      disableTopics: jest.fn(),
      enableTopics: jest.fn(),
    },
    quickstartsAPI: {
      version: 1,
      set: jest.fn(),
      toggle: jest.fn(),
      // eslint-disable-next-line react/display-name
      Catalog: () => <div></div>,
    },
  };

  beforeAll(() => {
    global.__webpack_init_sharing__ = () => undefined;
    global.__webpack_share_scopes__ = { default: {} };
  });

  beforeEach(() => {
    config = {
      foo: {
        manifestLocation: '/bar',
        appName: 'foo',
      },
    };
    mockStore = configureStore();
    initialState = {
      chrome: {
        user: {
          identity: {
            account_number: 'foo',
            user: { username: 'foo', first_name: 'foo', last_name: 'foo', is_org_admin: false, is_internal: false },
          },
        },
        activeApp: 'some-app',
        activeLocation: 'some-location',
        appId: 'app-id',
        quickstarts: {
          quickstarts: {},
        },
        moduleRoutes: [],
        navigation: {
          '/': {
            navItems: [],
          },
          insights: {
            navItems: [],
          },
        },
      },
      globalFilter: {
        tags: {},
        sid: {},
        workloads: {},
      },
    };
  });

  it('should render PageSidebar with LandingNav component', async () => {
    /**
     * Temporarily override the module mock
     */
    const isBetaSpy = jest.spyOn(utils, 'isBeta');
    isBetaSpy.mockReturnValue(true);
    const getEnvSpy = jest.spyOn(utils, 'getEnv');
    getEnvSpy.mockReturnValue('ci');

    const store = mockStore({
      ...initialState,
      chrome: {
        ...initialState.chrome,
        navigation: {
          landingPage: [],
        },
        user: {
          identity: {
            account_number: 'foo',
            user: {},
          },
        },
      },
    });
    let container;
    await act(async () => {
      const { container: internalContainer } = await render(
        <LibtJWTContext.Provider
          value={{
            initPromise: Promise.resolve(),
            jwt: {
              getUserInfo: () => Promise.resolve({}),
              getEncodedToken: () => '',
            },
          }}
        >
          <Provider store={store}>
            <MemoryRouter initialEntries={['/']}>
              <ScalprumRoot config={config} {...initialProps} />
            </MemoryRouter>
          </Provider>
        </LibtJWTContext.Provider>
      );
      container = internalContainer;
    });
    expect(container.querySelector('.chr-c-landing-nav')).toBeTruthy();
    /**
     * We have to clear the restore the mock to match the mocked module
     */
    isBetaSpy.mockReturnValue(false);
    getEnvSpy.mockReturnValue('qa');
  });

  it('should render PageSidebar with SideNav component', async () => {
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    const store = mockStore({
      globalFilter: { tags: {}, sid: {}, workloads: {} },
      chrome: {
        ...initialState.chrome,
        user: {
          identity: {
            account_number: 'foo',
            user: {},
          },
        },
      },
    });
    let getByLabelText;
    await act(async () => {
      const { getByLabelText: internalGetByLabelText } = await render(
        <LibtJWTContext.Provider
          value={{
            initPromise: Promise.resolve(),
            jwt: {
              getUserInfo: () => Promise.resolve({}),
              getEncodedToken: () => '',
            },
          }}
        >
          <Provider store={store}>
            <MemoryRouter initialEntries={['/']}>
              <ScalprumRoot globalFilterHidden config={config} {...initialProps} />
            </MemoryRouter>
          </Provider>
        </LibtJWTContext.Provider>
      );
      getByLabelText = internalGetByLabelText;
    });
    expect(getByLabelText('Insights Global Navigation')).toBeTruthy();
  });

  it('should render GlobalFilter', async () => {
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/insights',
        href: '/insights',
        host: 'foo.bar.baz',
      },
    });
    Object.defineProperty(window, 'insights', {
      value: {
        chrome: {
          getEnvironment: () => '',
        },
      },
    });
    const store = mockStore({
      ...initialState,
      chrome: {
        ...initialState.chrome,
        activeLocation: 'insights',
      },
    });

    const { container } = render(
      <LibtJWTContext.Provider
        value={{
          initPromise: Promise.resolve(),
          jwt: {
            getUserInfo: () => Promise.resolve({}),
            getEncodedToken: () => '',
          },
        }}
      >
        <Provider store={store}>
          <MemoryRouter initialEntries={['/insights']}>
            <ScalprumRoot config={config} globalFilterHidden={false} {...initialProps} />
          </MemoryRouter>
        </Provider>
      </LibtJWTContext.Provider>
    );
    await waitFor(() => expect(container.querySelector('#global-filter')).toBeTruthy());

    useLocationSpy.mockRestore();
  });
});
