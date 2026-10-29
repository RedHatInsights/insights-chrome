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

const mockUseFlag = jest.fn<(flagName: string) => boolean>();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flagName: string) => mockUseFlag(flagName),
}));

import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Lightwell from './Lightwell';
import { CONTENT_SOURCES_LIGHTWELL_REMOTE, LIGHTWELL_EXPERIENCE_REMOTE, LightwellRemote } from './lightwellRemote';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import { notificationDrawerExpandedAtom } from '../state/atoms/notificationDrawerAtom';
import { layoutBannerHiddenAtom, layoutForceGlassThemeAtom, layoutLightwellHeaderAtom } from '../state/atoms/releaseAtom';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import InternalChromeContext from '../utils/internalChromeContext';

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
  remote: LightwellRemote = CONTENT_SOURCES_LIGHTWELL_REMOTE
) => {
  const defaultFlags: Record<string, boolean> = {
    'platform.chrome.notifications-drawer': false,
    'platform.chrome.help-panel': false,
  };

  const flags = { ...defaultFlags, ...flagOverrides };
  mockUseFlag.mockImplementation((name: string) => flags[name] ?? false);

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
              <Lightwell Footer={<div data-testid="mock-footer" />} remote={remote} />
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

  it.each([
    ['/lightwell', CONTENT_SOURCES_LIGHTWELL_REMOTE],
    ['/lightwell-next', LIGHTWELL_EXPERIENCE_REMOTE],
  ] as const)('should apply the Lightwell page class on %s', (route, remote) => {
    renderLightwell({}, route, remote);
    expect(screen.getByTestId('lightwell-page')).toHaveClass('chr-c-page--lightwell', 'pf-m-plain');
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

  it.each([
    ['/lightwell', CONTENT_SOURCES_LIGHTWELL_REMOTE],
    ['/lightwell-next', LIGHTWELL_EXPERIENCE_REMOTE],
  ] as const)('should set activeModuleAtom to the %s remote scope and clear it on unmount', (route, remote) => {
    const { store, unmount } = renderLightwell({}, route, remote);
    expect(store.get(activeModuleAtom)).toBe(remote.scope);
    unmount();
    expect(store.get(activeModuleAtom)).toBeUndefined();
  });

  it('should render the established Breadcrumbs component with favorites support', () => {
    const { container } = renderLightwell();
    // Verify the Breadcrumbs component renders (uses established breadcrumbs behavior)
    const breadcrumb = container.querySelector('.chr-c-breadcrumbs');
    expect(breadcrumb).toBeTruthy();
  });

  describe.each([
    ['/lightwell', CONTENT_SOURCES_LIGHTWELL_REMOTE],
    ['/lightwell-next', LIGHTWELL_EXPERIENCE_REMOTE],
  ] as const)('horizontal navigation on %s', (basePath, remote) => {
    it('should render horizontal subnav with three navigation items', async () => {
      renderLightwell({}, basePath, remote);
      const nav = await screen.findByRole('navigation', { name: 'Lightwell navigation' });
      expect(nav).toBeTruthy();
      const links = within(nav).getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('should render Repositories, Lens, and Beacon links on the current prefix', async () => {
      renderLightwell({}, basePath, remote);
      const repoLink = await screen.findByRole('link', { name: 'Repositories' });
      const lensLink = screen.getByRole('link', { name: 'Lens' });
      const beaconLink = screen.getByRole('link', { name: 'Beacon' });
      expect(repoLink).toHaveAttribute('href', basePath);
      expect(lensLink).toHaveAttribute('href', `${basePath}/lens`);
      expect(beaconLink).toHaveAttribute('href', `${basePath}/beacon`);
    });

    it('should mark Repositories as active on the shell root', async () => {
      renderLightwell({}, basePath, remote);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should mark Lens as active on the lens route', async () => {
      renderLightwell({}, `${basePath}/lens`, remote);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Lens' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should mark Beacon as active on the beacon route', async () => {
      renderLightwell({}, `${basePath}/beacon`, remote);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Beacon' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should mark Repositories as active on an unknown subroute', async () => {
      renderLightwell({}, `${basePath}/unknown`, remote);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should not match a lens-preview path as Lens', async () => {
      renderLightwell({}, `${basePath}/lens-preview`, remote);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should not match a beacon-preview path as Beacon', async () => {
      renderLightwell({}, `${basePath}/beacon-preview`, remote);
      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', 'page');
      });
    });
  });
});
