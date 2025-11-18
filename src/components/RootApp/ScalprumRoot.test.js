import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ScalprumRoot from './ScalprumRoot';
import { act, render, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';

jest.mock('../Search/SearchInput', () => {
  return jest.fn().mockImplementation(() => <div />);
});

jest.mock('../../hooks/useAllServices', () => ({
  __esModule: true,
  default: () => ({
    linkSections: [],
    error: false,
    ready: true,
    availableSections: [],
    filterValue: '',
    setFilterValue: jest.fn(),
  }),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlagsStatus: () => ({ flagsReady: true, flagsError: false }),
  useFlag: () => false,
  useFlags: () => [],
}));

jest.mock('../../utils/fetchNavigationFiles', () => ({
  __esModule: true,
  default: () =>
    Promise.resolve([
      {
        id: 'insights',
        title: 'Insights',
        navItems: [
          {
            title: 'Test Item',
            href: '/insights/test',
            appId: 'test',
          },
        ],
      },
    ]),
  extractNavItemGroups: (navigation) => {
    if (Array.isArray(navigation)) {
      return navigation;
    }
    return navigation?.navItems || [];
  },
  isNavItems: (item) => Boolean(item?.navItems),
}));

jest.mock('../../utils/common', () => {
  const utils = jest.requireActual('../../utils/common');
  return {
    __esModule: true,
    ...utils,
    isBeta: jest.fn().mockReturnValue(false),
    getEnv: jest.fn().mockReturnValue('qa'),
  };
});

jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...actualAxios,
    default: {
      ...actualAxios.default,
      post: jest.fn().mockResolvedValue({ data: {} }),
      get: jest.fn().mockResolvedValue({ data: {} }),
    },
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} }),
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

jest.mock('../../utils/isNavItemVisible', () => ({
  evaluateVisibility: jest.fn().mockImplementation((item) => Promise.resolve(item)),
}));

jest.mock('../../hooks/useFeoConfig', () => ({
  __esModule: true,
  default: () => true,
}));

jest.mock('../../utils/useNavigation', () => ({
  __esModule: true,
  default: () => ({
    loaded: true,
    schema: {
      id: 'insights',
      title: 'Insights',
      navItems: [
        {
          title: 'Test Item',
          href: '/insights/test',
          appId: 'test',
        },
      ],
    },
    noNav: false,
  }),
}));

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
import { selectedTagsAtom } from '../../state/atoms/globalFilterAtom';
import { navigationAtom } from '../../state/atoms/navigationAtom';

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
  });

  const defaultAtomValues = [
    [hidePreviewBannerAtom, false],
    [isPreviewAtom, false],
    [userConfigAtom, { data: {} }],
    [selectedTagsAtom, {}],
    [activeModuleAtom, 'foo'],
    [
      navigationAtom,
      {
        insights: {
          id: 'insights',
          title: 'Insights',
          navItems: [
            {
              title: 'Test Item',
              href: '/insights/test',
              appId: 'test',
            },
          ],
        },
      },
    ],
  ];

  it('should render PageSidebar with SideNav component', async () => {
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    let getByLabelText;
    await act(async () => {
      const { getByLabelText: internalGetByLabelText } = await render(
        <JotaiTestProvider initialValues={defaultAtomValues}>
          <ChromeAuthContext.Provider value={chromeContextMockValue}>
            <MemoryRouter initialEntries={['/insights']}>
              <ScalprumRoot globalFilterHidden config={config} {...initialProps} />
            </MemoryRouter>
          </ChromeAuthContext.Provider>
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

    const { container } = await render(
      <JotaiTestProvider initialValues={defaultAtomValues}>
        <ChromeAuthContext.Provider value={chromeContextMockValue}>
          <MemoryRouter initialEntries={['/insights']}>
            <ScalprumRoot config={config} globalFilterHidden={false} {...initialProps} />
          </MemoryRouter>
        </ChromeAuthContext.Provider>
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

    const atomValuesWithoutModule = [
      [hidePreviewBannerAtom, false],
      [isPreviewAtom, false],
      [userConfigAtom, { data: {} }],
      [selectedTagsAtom, {}],
      [activeModuleAtom, undefined],
    ];

    const { container } = await render(
      <JotaiTestProvider initialValues={atomValuesWithoutModule}>
        <ChromeAuthContext.Provider value={chromeContextMockValue}>
          <MemoryRouter initialEntries={['/insights']}>
            <ScalprumRoot config={config} globalFilterHidden={false} {...initialProps} />
          </MemoryRouter>
        </ChromeAuthContext.Provider>
      </JotaiTestProvider>
    );
    await waitFor(() => expect(container.querySelector('#global-filter')).toBeFalsy());

    useLocationSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});
