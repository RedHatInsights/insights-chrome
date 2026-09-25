import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ScalprumRoot from './ScalprumRoot';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { PluginManifest, RemotePluginManifest } from '@openshift/dynamic-plugin-sdk';
import { ScalprumProviderConfigurableProps } from '@scalprum/react-core';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { NavItem, Navigation } from '../../@types/types';
import { ScalprumConfig } from '../../state/atoms/scalprumConfigAtom';

jest.mock('../Footer/Footer', () => () => null);

let mockScalprumProviderProps: ScalprumProviderConfigurableProps<{ chrome: ChromeAPI }> | undefined;
jest.mock('@scalprum/react-core', () => {
  const actual = jest.requireActual('@scalprum/react-core');
  return {
    __esModule: true,
    ...actual,
    ScalprumProvider: (props: ScalprumProviderConfigurableProps<{ chrome: ChromeAPI }>) => {
      mockScalprumProviderProps = props;
      return actual.ScalprumProvider(props);
    },
  };
});

jest.mock('../../layouts/Lightwell', () => {
  const Lightwell = ({ Footer }: { Footer?: React.ReactNode }) => (
    <div id="chrome-app-render-root">
      <div className="chr-c-masthead" />
      <div data-testid="lightwell-content" />
      {Footer}
    </div>
  );
  return { __esModule: true, default: Lightwell };
});

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
  useFlag: jest.fn(() => false),
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
  extractNavItemGroups: (navigation: Navigation | NavItem[]) => {
    if (Array.isArray(navigation)) {
      return navigation;
    }
    return navigation?.navItems || [];
  },
  isNavItems: (item: Navigation | NavItem[]) => Boolean(!Array.isArray(item) && item?.navItems),
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
    useLocation: jest.fn().mockImplementation((...args: Parameters<typeof routerDom.useLocation>) => {
      return routerDom.useLocation(...args);
    }),
  };
});

jest.mock('../../utils/isNavItemVisible', () => ({
  evaluateVisibility: jest.fn().mockImplementation(<T,>(item: T) => Promise.resolve(item)),
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
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';
import { useFlag } from '@unleash/proxy-client-react';
import { selectedTagsAtom } from '../../state/atoms/globalFilterAtom';
import { navigationAtom } from '../../state/atoms/navigationAtom';

interface HydrateAtomsProps {
  // a mix of unrelated atom/value pairs; useHydrateAtoms' own generics are too strict to express that plainly
  initialValues: unknown[];
  children: React.ReactNode;
}

const HydrateAtoms = ({ initialValues, children }: HydrateAtomsProps) => {
  useHydrateAtoms(initialValues as unknown as Parameters<typeof useHydrateAtoms>[0]);
  return children;
};

interface JotaiTestProviderProps {
  initialValues: unknown[];
  children: React.ReactNode;
}

const JotaiTestProvider = ({ initialValues, children }: JotaiTestProviderProps) => (
  <JotaiProvider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </JotaiProvider>
);

describe('ScalprumRoot', () => {
  let config: ScalprumConfig;
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
        name: 'foo',
      },
      virtualAssistant: {
        manifestLocation: '/virtual-assistant',
        name: 'baz',
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
    let getByLabelText!: ReturnType<typeof render>['getByLabelText'];
    await act(async () => {
      const { getByLabelText: internalGetByLabelText } = render(
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
    const fetchSpy = jest.spyOn(window, 'fetch').mockImplementationOnce(() => Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) }));
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    jsdomReconfigure({ url: 'https://foo.bar.baz/insights' });
    Object.defineProperty(window, 'insights', {
      value: {
        chrome: {
          getEnvironment: () => '',
        },
      },
      configurable: true,
    });

    const { container } = render(
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
    jsdomReset();
  });

  it('should render /lightwell route without PageSidebar', async () => {
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/lightwell', search: undefined, hash: undefined });

    const { container } = render(
      <JotaiTestProvider initialValues={defaultAtomValues}>
        <ChromeAuthContext.Provider value={chromeContextMockValue}>
          <MemoryRouter initialEntries={['/lightwell']}>
            <ScalprumRoot config={config} {...initialProps} />
          </MemoryRouter>
        </ChromeAuthContext.Provider>
      </JotaiTestProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
      expect(container.querySelector('.chr-c-masthead')).toBeTruthy();
      expect(container.querySelector('#chr-c-sidebar')).toBeFalsy();
      expect(screen.getByRole('list', { name: 'Lightwell footer links' })).toBeTruthy();
    });

    useLocationSpy.mockRestore();
  });

  // Redundant guard for the flex-shell layout: the JS banner-height calc was replaced by a CSS
  // flexbox shell (.chr-c-shell => flex column; #chrome-app-render-root => flex: 1 1 0). That only
  // works if .chr-c-shell is the DIRECT parent wrapping the banners and the render root together.
  // If a future refactor moves the wrapper or nests it, the render root loses its sizing and the
  // double-scrollbar / cut-off-content regression returns. This test fails loudly if that happens.
  it('wraps the banners and the render root together as direct children of .chr-c-shell', async () => {
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    // Enable the degraded-state banner so BOTH shell banners are present in the DOM at once.
    const useFlagMock = jest.mocked(useFlag);
    useFlagMock.mockImplementation((flag: string) => flag === 'platform.chrome.degraded-state-banner');

    const atomValues = [
      ...defaultAtomValues,
      [degradedStateAtom, { userPersonalization: true, entitlements: false, configFromCache: false, featureFlags: false }],
    ];

    let container!: HTMLElement;
    await act(async () => {
      const rendered = render(
        <JotaiTestProvider initialValues={atomValues}>
          <ChromeAuthContext.Provider value={chromeContextMockValue}>
            <MemoryRouter initialEntries={['/insights']}>
              <ScalprumRoot config={config} {...initialProps} />
            </MemoryRouter>
          </ChromeAuthContext.Provider>
        </JotaiTestProvider>
      );
      container = rendered.container;
    });

    await waitFor(() => {
      const shell = container.querySelector('.chr-c-shell');
      expect(shell).toBeTruthy();

      // Render root must be a DIRECT child of the shell so its `flex: 1 1 0` sizing applies.
      const renderRoot = container.querySelector('#chrome-app-render-root');
      expect(renderRoot).toBeTruthy();
      expect(renderRoot?.parentElement).toBe(shell);

      // BetaSwitcher banner: its outer wrapper <div> must be a direct child of the shell,
      // so the Split (.chr-c-beta-switcher) sits two levels below the shell.
      const betaSwitcher = container.querySelector('.chr-c-beta-switcher');
      expect(betaSwitcher).toBeTruthy();
      expect(betaSwitcher?.parentElement?.parentElement).toBe(shell);

      // DegradedStateBanner must also be a direct child of the shell.
      const degradedBanner = container.querySelector('[data-ouia-component-id="DegradedStateBanner"]');
      expect(degradedBanner).toBeTruthy();
      expect(degradedBanner?.parentElement).toBe(shell);

      // Guard: no render root may live outside the shell (would escape flex sizing entirely).
      const rootsOutsideShell = Array.from(container.querySelectorAll('#chrome-app-render-root')).filter((el) => !el.closest('.chr-c-shell'));
      expect(rootsOutsideShell).toHaveLength(0);
    });

    useFlagMock.mockReturnValue(false);
    useLocationSpy.mockRestore();
  });

  it('should not render GlobalFilter', async () => {
    const fetchSpy = jest.spyOn(window, 'fetch').mockImplementationOnce(() => Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) }));
    const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
    useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });
    jsdomReconfigure({ url: 'https://foo.bar.baz/insights' });
    Object.defineProperty(window, 'insights', {
      value: {
        chrome: {
          getEnvironment: () => '',
        },
      },
      configurable: true,
    });

    const atomValuesWithoutModule = [
      [hidePreviewBannerAtom, false],
      [isPreviewAtom, false],
      [userConfigAtom, { data: {} }],
      [selectedTagsAtom, {}],
      [activeModuleAtom, undefined],
    ];

    const { container } = render(
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
    jsdomReset();
  });

  describe('transformPluginManifest', () => {
    it('should transform remote manifests via transformScalprumManifest and pass through local manifests unchanged', async () => {
      const useLocationSpy = jest.spyOn(routerDom, 'useLocation');
      useLocationSpy.mockReturnValue({ pathname: '/insights', search: undefined, hash: undefined });

      await act(async () => {
        render(
          <JotaiTestProvider initialValues={defaultAtomValues}>
            <ChromeAuthContext.Provider value={chromeContextMockValue}>
              <MemoryRouter initialEntries={['/insights']}>
                <ScalprumRoot config={config} {...initialProps} />
              </MemoryRouter>
            </ChromeAuthContext.Provider>
          </JotaiTestProvider>
        );
      });

      const transformPluginManifest = mockScalprumProviderProps.pluginSDKOptions.pluginLoaderOptions.transformPluginManifest;

      const remoteManifest: RemotePluginManifest = {
        version: '1.0.0',
        baseURL: '/',
        name: 'chrome',
        loadScripts: ['/script1.js'],
        extensions: [],
        registrationMethod: 'callback',
      };
      const originalLoadScripts = remoteManifest.loadScripts;
      const transformedRemoteManifest = transformPluginManifest(remoteManifest);
      expect(transformedRemoteManifest).toEqual({ ...remoteManifest, loadScripts: [] });
      expect(transformedRemoteManifest).not.toBe(remoteManifest);
      expect(remoteManifest.loadScripts).toBe(originalLoadScripts);

      const localManifest: PluginManifest = {
        name: 'local-plugin',
        version: '1.0.0',
        extensions: [],
        registrationMethod: 'local',
      };
      expect(transformPluginManifest(localManifest)).toBe(localManifest);

      useLocationSpy.mockRestore();
    });
  });
});
