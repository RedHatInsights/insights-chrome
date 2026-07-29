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

jest.unmock('../components/NotificationsDrawer/DrawerPanelContent');

// jest.mock does not intercept @scalprum/* in this project's SWC/Jest setup,
// so we initialize scalprum with a stub config instead.
import { initialize } from '@scalprum/core';

const mockUseFlag = jest.fn<(flagName: string) => boolean>();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flagName: string) => mockUseFlag(flagName),
}));

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Lightwell from './Lightwell';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { notificationDrawerExpandedAtom } from '../state/atoms/notificationDrawerAtom';
import { layoutBannerHiddenAtom, layoutForceGlassThemeAtom, layoutLightwellHeaderAtom } from '../state/atoms/releaseAtom';
import ChromeAuthContext, { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import InternalChromeContext from '../utils/internalChromeContext';
import { ChromeAPI } from '@redhat-cloud-services/types';

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
} as unknown as ChromeAuthContextValue;

const mockInternalChromeContextValue = {
  drawerActions: {
    toggleDrawerContent: jest.fn(),
  },
} as unknown as ChromeAPI;

const renderLightwell = (flagOverrides: Record<string, boolean> = {}) => {
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
      <MemoryRouter>
        <ChromeAuthContext.Provider value={mockAuthContextValue}>
          <InternalChromeContext.Provider value={mockInternalChromeContextValue}>
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
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.classList.remove('pf-v6-theme-felt', 'pf-v6-theme-glass');
  });

  it('should render the layout shell', () => {
    const { container } = renderLightwell();
    expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
    expect(container.querySelector('.chr-c-masthead')).toBeTruthy();
    expect(container.querySelector('[data-testid="mock-footer"]')).toBeTruthy();
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

  it('should render breadcrumb with "Hybrid Cloud Console" linking to / and active "Lightwell"', () => {
    const { container } = renderLightwell();
    const breadcrumb = container.querySelector('.chr-c-breadcrumbs');
    expect(breadcrumb).toBeTruthy();

    const items = breadcrumb!.querySelectorAll('.pf-v6-c-breadcrumb__item');
    expect(items.length).toBe(2);

    const firstLink = items[0].querySelector('a');
    expect(firstLink).toBeTruthy();
    expect(firstLink!.getAttribute('href')).toBe('/');
    expect(firstLink!.textContent).toContain('Hybrid Cloud Console');

    const activeItem = items[1];
    expect(activeItem.textContent).toContain('Lightwell');
  });
});
