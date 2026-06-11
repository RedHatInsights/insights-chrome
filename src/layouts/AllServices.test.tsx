/**
 * Unit tests for AllServices drawer wiring
 *
 * These tests verify that the drawer infrastructure is properly wired
 * when feature flags are enabled, matching the pattern from DefaultLayout.tsx
 */

// Mock dependencies
jest.mock('../components/Header/Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('../components/Stratosphere/RedirectBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-redirect-banner">RedirectBanner</div>,
}));

jest.mock('../components/AllServices/AllServicesSection', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-all-services-section">AllServicesSection</div>,
}));

jest.mock('../components/AllServices/AllServicesBundle', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-all-services-bundle">AllServicesBundle</div>,
}));

jest.mock('../hooks/useAllServices', () => ({
  __esModule: true,
  default: () => ({
    linkSections: [],
    error: null,
    ready: true,
    filterValue: '',
    setFilterValue: jest.fn(),
  }),
}));

jest.mock('../hooks/useAllLinks', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchBundles: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
}));

jest.mock('../utils/common', () => ({
  updateDocumentTitle: jest.fn(),
}));

jest.unmock('../components/NotificationsDrawer/DrawerPanelContent');

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: (props: Record<string, unknown>) => <div data-testid="scalprum-content" data-scope={props.scope} />,
}));

jest.mock('@redhat-cloud-services/frontend-components/Spinner', () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));

const mockUseFlag = jest.fn<(flagName: string) => boolean>();
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (flagName: string) => mockUseFlag(flagName),
}));

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import AllServices from './AllServices';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { drawerPanelContentAtom } from '../state/atoms/drawerPanelContentAtom';
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

const renderAllServices = (flagOverrides: Record<string, boolean> = {}) => {
  const defaultFlags: Record<string, boolean> = {
    'platform.chrome.notifications-drawer': false,
    'platform.chrome.help-panel': false,
    'platform.chrome.allservices.redesign': false,
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
              <AllServices />
            </Provider>
          </InternalChromeContext.Provider>
        </ChromeAuthContext.Provider>
      </MemoryRouter>
    ),
  };
};

describe('AllServices - Drawer Wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component renders without crashing', () => {
    it('should render when no drawer flags are enabled', () => {
      const { container } = renderAllServices();
      expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
    });

    it('should render when help-panel flag is enabled', () => {
      const { container } = renderAllServices({
        'platform.chrome.help-panel': true,
      });
      expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
    });

    it('should render when notifications-drawer flag is enabled', () => {
      const { container } = renderAllServices({
        'platform.chrome.notifications-drawer': true,
      });
      expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
    });

    it('should render when both drawer flags are enabled', () => {
      const { container } = renderAllServices({
        'platform.chrome.help-panel': true,
        'platform.chrome.notifications-drawer': true,
      });
      expect(container.querySelector('#chrome-app-render-root')).toBeTruthy();
    });
  });

  describe('Drawer state management', () => {
    it('should initialize with drawer collapsed', () => {
      const { store } = renderAllServices({
        'platform.chrome.help-panel': true,
      });

      expect(store.get(notificationDrawerExpandedAtom)).toBe(false);
    });

    it('should allow drawer expanded state to be set via atom', () => {
      const { store } = renderAllServices({
        'platform.chrome.help-panel': true,
      });

      store.set(notificationDrawerExpandedAtom, true);
      expect(store.get(notificationDrawerExpandedAtom)).toBe(true);

      store.set(notificationDrawerExpandedAtom, false);
      expect(store.get(notificationDrawerExpandedAtom)).toBe(false);
    });

    it('should allow drawer content atom to be set', () => {
      const { store } = renderAllServices({
        'platform.chrome.help-panel': true,
      });

      store.set(drawerPanelContentAtom, {
        scope: 'learningResources',
        module: './HelpPanel',
      });

      const content = store.get(drawerPanelContentAtom);
      expect(content).toEqual({
        scope: 'learningResources',
        module: './HelpPanel',
      });
    });

    it('should allow drawer content atom to be cleared', () => {
      const { store } = renderAllServices({
        'platform.chrome.help-panel': true,
      });

      store.set(drawerPanelContentAtom, {
        scope: 'learningResources',
        module: './HelpPanel',
      });
      expect(store.get(drawerPanelContentAtom)).toBeTruthy();

      store.set(drawerPanelContentAtom, undefined);
      expect(store.get(drawerPanelContentAtom)).toBeUndefined();
    });
  });
});
