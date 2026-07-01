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
      },
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
});
