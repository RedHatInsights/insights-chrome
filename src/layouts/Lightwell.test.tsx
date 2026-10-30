const flagErrorListeners = new Set<(error?: unknown) => void>();
const mockUnleashClient = {
  on: (event: string, listener: (error?: unknown) => void) => {
    if (event === 'error') {
      flagErrorListeners.add(listener);
    }
  },
  off: (event: string, listener: (error?: unknown) => void) => {
    if (event === 'error') {
      flagErrorListeners.delete(listener);
    }
  },
  getError: () => undefined,
};

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
  useFlagsStatus: jest.fn(() => ({ flagsReady: true, flagsError: null })),
  useUnleashClient: () => mockUnleashClient,
}));

jest.mock('../components/Header/Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('../components/Stratosphere/RedirectBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-redirect-banner">RedirectBanner</div>,
}));

jest.mock('../components/ErrorComponents/DefaultErrorComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-error-component" />,
}));

jest.mock('../hooks/useBreadcrumbsLinks', () => ({
  __esModule: true,
  default: () => [{ title: 'Lightwell', href: '/lightwell' }],
}));

jest.mock('../hooks/useFavoritePagesWrapper', () => ({
  __esModule: true,
  default: () => ({
    favoritePages: [],
    favoritePage: jest.fn(),
    unfavoritePage: jest.fn(),
  }),
}));

jest.unmock('../components/NotificationsDrawer/DrawerPanelContent');

// jest.mock does not intercept @scalprum/* in this project's SWC/Jest setup,
// so we initialize scalprum with a stub config instead.
import { getSharedScope, initialize } from '@scalprum/core';

import { useFlag, useFlagsStatus } from '@unleash/proxy-client-react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Lightwell from './Lightwell';
// A value import of jest stops SWC from hoisting jest.mock above the module imports.
import { type jest as Jest, beforeEach, describe, expect, it } from '@jest/globals';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import { notificationDrawerExpandedAtom } from '../state/atoms/notificationDrawerAtom';
import { layoutBannerHiddenAtom, layoutForceGlassThemeAtom, layoutLightwellHeaderAtom } from '../state/atoms/releaseAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import InternalChromeContext from '../utils/internalChromeContext';

const mockUseFlag = useFlag as unknown as Jest.Mock<(flagName: string) => boolean>;
const mockUseFlagsStatus = useFlagsStatus as unknown as Jest.Mock<() => { flagsReady: boolean; flagsError: unknown }>;

const mockUser = {
  identity: {
    account_number: '123456',
    org_id: 'org123',
    user: {
      username: 'testuser',
      email: 'test@redhat.com',
      first_name: 'Test',
      last_name: 'User',
      is_org_admin: false,
      is_internal: false,
    },
  },
};

const mockAuthContextValue = {
  user: mockUser,
  token: 'test-token',
  ready: true,
  login: jest.fn(),
  logout: jest.fn(),
  getUser: jest.fn<() => Promise<typeof mockUser>>().mockResolvedValue(mockUser),
  getToken: jest.fn<() => Promise<string>>().mockResolvedValue('test-token'),
};

const mockInternalChromeContextValue = {
  drawerActions: {
    toggleDrawerContent: jest.fn(),
  },
};

const renderLightwell = (
  flagOverrides: Record<string, boolean> = {},
  initialRoute = '/lightwell',
  flagsStatus: { flagsReady: boolean; flagsError: unknown } = { flagsReady: true, flagsError: null }
) => {
  const defaultFlags: Record<string, boolean> = {
    'platform.chrome.notifications-drawer': false,
    'platform.chrome.help-panel': false,
    'platform.chrome.lightwell-experience': false,
  };

  const flags = { ...defaultFlags, ...flagOverrides };
  mockUseFlag.mockImplementation((name: string) => flags[name] ?? false);
  mockUseFlagsStatus.mockReturnValue(flagsStatus);

  const store = createStore();

  return {
    store,
    ...render(
      <MemoryRouter initialEntries={[initialRoute]}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ChromeAuthContext.Provider value={mockAuthContextValue as any}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <InternalChromeContext.Provider value={mockInternalChromeContextValue as any}>
            <Provider store={store}>
              <Lightwell Footer={<div data-testid="mock-footer" />} />
            </Provider>
          </InternalChromeContext.Provider>
        </ChromeAuthContext.Provider>
      </MemoryRouter>
    ),
  };
};

describe('Lightwell', () => {
  beforeAll(() => {
    initialize({
      appsConfig: {
        contentSources: {
          name: 'contentSources',
          manifestLocation: '/test/manifest.json',
        },
        lightwellExperience: {
          name: 'lightwellExperience',
          manifestLocation: '/apps/lightwell-experience/fed-mods.json',
        },
      },
    });
    getSharedScope()['@chrome/visibilityFunctions'] = {
      '*': {
        loaded: 1,
        get: () => ({
          apiRequest: () => Promise.resolve(true),
        }),
      },
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    flagErrorListeners.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove('pf-v6-theme-felt', 'pf-v6-theme-glass', 'lightwell-v1-theme');
  });

  it('should render the layout shell', () => {
    const { container } = renderLightwell();
    expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
    expect(container.querySelector('.chr-c-masthead')).toBeTruthy();
    expect(container.querySelector('[data-testid="mock-footer"]')).toBeTruthy();
  });

  it('should render the footer after the page, outside the page card', () => {
    const { container } = renderLightwell();
    const root = container.querySelector('#chrome-app-render-root');
    const page = container.querySelector('.pf-v6-c-page');
    const footer = container.querySelector('[data-testid="mock-footer"]');

    expect(root?.contains(footer)).toBe(true);
    expect(page?.contains(footer)).toBe(false);
    expect(page?.nextElementSibling).toBe(footer);
  });

  it('should apply the plain Page variant', () => {
    renderLightwell();
    expect(screen.getByTestId('lightwell-page')).toHaveClass('pf-m-plain');
  });

  it('should not render sidebar navigation', () => {
    const { container } = renderLightwell();
    expect(container.querySelector('#chr-c-sidebar')).toBeFalsy();
  });

  it('should render when drawer flags are enabled', () => {
    const { container } = renderLightwell({
      'platform.chrome.notifications-drawer': true,
      'platform.chrome.help-panel': true,
    });
    expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
  });

  it('should initialize with drawer collapsed', () => {
    const { store } = renderLightwell({
      'platform.chrome.help-panel': true,
    });
    expect(store.get(notificationDrawerExpandedAtom)).toBe(false);
  });

  it('should add pf-v6-theme-felt class to document root on mount', () => {
    renderLightwell();
    expect(document.documentElement.classList.contains('pf-v6-theme-felt')).toBe(true);
  });

  it('should remove pf-v6-theme-felt class from document root on unmount', () => {
    const { unmount } = renderLightwell();
    expect(document.documentElement.classList.contains('pf-v6-theme-felt')).toBe(true);
    unmount();
    expect(document.documentElement.classList.contains('pf-v6-theme-felt')).toBe(false);
  });

  it('should keep the preload theme while mounted and remove it when leaving Lightwell', () => {
    document.documentElement.classList.add('lightwell-v1-theme');
    const { unmount } = renderLightwell();
    expect(document.documentElement).toHaveClass('lightwell-v1-theme');
    unmount();
    expect(document.documentElement).not.toHaveClass('lightwell-v1-theme');
  });

  it('should set layoutBannerHiddenAtom to true on mount and false on unmount', () => {
    const { store, unmount } = renderLightwell();
    expect(store.get(layoutBannerHiddenAtom)).toBe(true);
    unmount();
    expect(store.get(layoutBannerHiddenAtom)).toBe(false);
  });

  it('should set layoutForceGlassThemeAtom to true on mount and false on unmount', () => {
    const { store, unmount } = renderLightwell();
    expect(store.get(layoutForceGlassThemeAtom)).toBe(true);
    unmount();
    expect(store.get(layoutForceGlassThemeAtom)).toBe(false);
  });

  it('should set layoutLightwellHeaderAtom to true on mount and false on unmount', () => {
    const { store, unmount } = renderLightwell();
    expect(store.get(layoutLightwellHeaderAtom)).toBe(true);
    unmount();
    expect(store.get(layoutLightwellHeaderAtom)).toBe(false);
  });

  it('should not choose a remote until feature flags resolve', () => {
    const fetchSpy = jest.spyOn(window, 'fetch').mockImplementation(() => new Promise(() => undefined));
    const { store } = renderLightwell({}, '/lightwell', { flagsReady: false, flagsError: null });

    expect(store.get(activeModuleAtom)).toBeUndefined();
    expect(screen.getByRole('progressbar', { name: 'Contents' })).toBeInTheDocument();
    const requestedUrls = fetchSpy.mock.calls.map(([input]) => String(input));
    expect(requestedUrls).not.toContain('/test/manifest.json');
    expect(requestedUrls).not.toContain('/apps/lightwell-experience/fed-mods.json');
    fetchSpy.mockRestore();
  });

  it('does not mount a remote when only a metrics error is reported', () => {
    const { store } = renderLightwell({}, '/lightwell', { flagsReady: false, flagsError: { type: 'metrics', error: new Error('metrics') } });
    act(() => {
      flagErrorListeners.forEach((listener) => listener({ type: 'metrics', error: new Error('metrics') }));
    });

    expect(store.get(activeModuleAtom)).toBeUndefined();
    expect(screen.getByRole('progressbar', { name: 'Contents' })).toBeInTheDocument();
  });

  it('should load content-sources when the flag request fails', () => {
    const { store } = renderLightwell({}, '/lightwell', { flagsReady: false, flagsError: null });
    act(() => {
      flagErrorListeners.forEach((listener) => listener({ type: 'fetch-toggles', error: new Error('flags failed') }));
    });

    expect(store.get(activeModuleAtom)).toBe('contentSources');
  });

  it('uses content-sources when a cached enabled flag is followed by a failed initial request', () => {
    const { store } = renderLightwell({ 'platform.chrome.lightwell-experience': true }, '/lightwell', { flagsReady: false, flagsError: null });
    act(() => {
      flagErrorListeners.forEach((listener) => listener({ type: 'fetch-toggles', error: new Error('flags failed') }));
    });

    expect(store.get(activeModuleAtom)).toBe('contentSources');
  });

  it('keeps the fallback remote mounted when a flag error is cleared before the next response', () => {
    const { store, rerender } = renderLightwell({}, '/lightwell', { flagsReady: false, flagsError: null });
    act(() => {
      flagErrorListeners.forEach((listener) => listener({ type: 'HttpError', code: 503 }));
    });
    expect(store.get(activeModuleAtom)).toBe('contentSources');

    mockUseFlagsStatus.mockReturnValue({ flagsReady: false, flagsError: null });
    rerender(
      <MemoryRouter initialEntries={['/lightwell']}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ChromeAuthContext.Provider value={mockAuthContextValue as any}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <InternalChromeContext.Provider value={mockInternalChromeContextValue as any}>
            <Provider store={store}>
              <Lightwell Footer={<div data-testid="mock-footer" />} />
            </Provider>
          </InternalChromeContext.Provider>
        </ChromeAuthContext.Provider>
      </MemoryRouter>
    );

    expect(store.get(activeModuleAtom)).toBe('contentSources');
  });

  it('should load content-sources when the lightwell experience flag is disabled', () => {
    const { store, unmount } = renderLightwell();
    expect(mockUseFlag).toHaveBeenCalledWith('platform.chrome.lightwell-experience');
    expect(store.get(activeModuleAtom)).toBe('contentSources');
    unmount();
    expect(store.get(activeModuleAtom)).toBeUndefined();
  });

  it('should load lightwell-experience when the lightwell experience flag is enabled', () => {
    const { store, unmount } = renderLightwell({ 'platform.chrome.lightwell-experience': true });
    expect(store.get(activeModuleAtom)).toBe('lightwellExperience');
    unmount();
    expect(store.get(activeModuleAtom)).toBeUndefined();
  });

  it('should render the established Breadcrumbs component with favorites support', () => {
    const { container } = renderLightwell();
    // Verify the Breadcrumbs component renders (uses established breadcrumbs behavior)
    const breadcrumb = container.querySelector('.chr-c-breadcrumbs');
    expect(breadcrumb).toBeTruthy();
  });

  describe('horizontal navigation', () => {
    it('should render horizontal subnav with three navigation items', async () => {
      renderLightwell();
      const nav = await screen.findByRole('navigation', { name: 'Lightwell navigation' });
      expect(nav).toBeTruthy();
      const links = within(nav).getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('should render Repositories, Lens, and Beacon links', async () => {
      renderLightwell();
      const repoLink = await screen.findByRole('link', { name: 'Repositories' });
      const lensLink = screen.getByRole('link', { name: 'Lens' });
      const beaconLink = screen.getByRole('link', { name: 'Beacon' });
      expect(repoLink).toHaveAttribute('href', '/lightwell');
      expect(lensLink).toHaveAttribute('href', '/lightwell/lens');
      expect(beaconLink).toHaveAttribute('href', '/lightwell/beacon');
    });

    it('should mark Repositories as active on /lightwell', async () => {
      renderLightwell({}, '/lightwell');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should mark Lens as active on /lightwell/lens', async () => {
      renderLightwell({}, '/lightwell/lens');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should mark Beacon as active on /lightwell/beacon', async () => {
      renderLightwell({}, '/lightwell/beacon');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should mark Repositories as active on unknown Lightwell subroute', async () => {
      renderLightwell({}, '/lightwell/unknown');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should not match /lightwell/lens-preview as Lens', async () => {
      renderLightwell({}, '/lightwell/lens-preview');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should not match /lightwell/beacon-preview as Beacon', async () => {
      renderLightwell({}, '/lightwell/beacon-preview');
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });
  });
});
