import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ScalprumRoot from './ScalprumRoot';
import { act, render, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { Provider as JotaiProvider } from 'jotai';

jest.mock('../Search/SearchInput', () => {
  return jest.fn().mockImplementation(() => <div />);
});

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
    useFlags: () => [],
  };
});

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

import * as routerDom from 'react-router-dom';
import { initializeVisibilityFunctions } from '../../utils/VisibilitySingleton';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useHydrateAtoms } from 'jotai/utils';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { hidePreviewBannerAtom, isPreviewAtom } from '../../state/atoms/releaseAtom';
import { userConfigAtom } from '../../state/atoms/userConfigAtom';

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const JotaiTestProvider = ({ initialValues, children }) => (
  <JotaiProvider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </JotaiProvider>
);

describe('ScalprumRoot', () => {
  let initialState;
  let mockStore;
  let config;
  const chromeContextMockValue = {
    getToken() {
      return Promise.resolve('a.a');
    },
    ready: true,
    user: {
      identity: {
        account_number: '0',
        type: 'User',
        org_id: '123',
        user: {
          username: 'foo',
          first_name: 'foo',
          last_name: 'foo',
          is_org_admin: false,
          is_internal: false,
        },
      },
    },
    getUser() {
      return Promise.resolve({
        identity: {
          account_number: '0',
          type: 'User',
          org_id: '123',
          user: {
            username: 'foo',
            first_name: 'foo',
            last_name: 'foo',
            is_org_admin: false,
            is_internal: false,
          },
        },
        entitlements: {
          insights: {
            is_entitled: true,
          },
        },
      });
    },
  };
  const initialProps = {
    cookieElement: null,
    setCookieElement: () => undefined,
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
      activateQuickstart: jest.fn(),
    },
  };

  beforeAll(() => {
    global.__webpack_init_sharing__ = () => undefined;
    global.__webpack_share_scopes__ = { default: {} };
    initializeVisibilityFunctions({});
  });

  beforeEach(() => {
    config = {
      foo: {
        manifestLocation: '/bar',
        appName: 'foo',
      },
      virtualAssistant: {
        manifestLocation: '/virtual-assistant',
        appName: 'baz',
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
        notifications: { data: [] },
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
        <JotaiTestProvider
          initialValues={[
            [hidePreviewBannerAtom, false],
            [isPreviewAtom, false],
            [userConfigAtom, { data: {} }],
          ]}
        >
          <Provider store={store}>
            <ChromeAuthContext.Provider value={chromeContextMockValue}>
              <MemoryRouter initialEntries={['/*']}>
                <ScalprumRoot globalFilterHidden config={config} {...initialProps} />
              </MemoryRouter>
            </ChromeAuthContext.Provider>
          </Provider>
        </JotaiTestProvider>
      );
      getByLabelText = internalGetByLabelText;
    });
    expect(getByLabelText('Insights Global Navigation')).toBeTruthy();
  });

  it('should render GlobalFilter', async () => {
    const fetchSpy = jest.spyOn(window, 'fetch').mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => ({}) }));
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

    const { container } = await render(
      <JotaiTestProvider initialValues={[[activeModuleAtom, 'foo']]}>
        <Provider store={store}>
          <ChromeAuthContext.Provider value={chromeContextMockValue}>
            <MemoryRouter initialEntries={['/insights']}>
              <ScalprumRoot config={config} globalFilterHidden={false} {...initialProps} />
            </MemoryRouter>
          </ChromeAuthContext.Provider>
        </Provider>
      </JotaiTestProvider>
    );
    await waitFor(() => expect(container.querySelector('#global-filter')).toBeTruthy());

    useLocationSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('should not render GlobalFilter', async () => {
    const fetchSpy = jest.spyOn(window, 'fetch').mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => ({}) }));
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

    const { container } = await render(
      <JotaiTestProvider initialValues={[[activeModuleAtom, undefined]]}>
        <Provider store={store}>
          <ChromeAuthContext.Provider value={chromeContextMockValue}>
            <MemoryRouter initialEntries={['/insights']}>
              <ScalprumRoot config={config} globalFilterHidden={false} {...initialProps} />
            </MemoryRouter>
          </ChromeAuthContext.Provider>
        </Provider>
      </JotaiTestProvider>
    );
    await waitFor(() => expect(container.querySelector('#global-filter')).toBeFalsy());

    useLocationSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});
