jest.mock('../../hooks/useWindowWidth', () => ({
  __esModule: true,
  default: () => ({ md: true, lg: true, xl: true }),
}));

jest.mock('../../hooks/useAllServices', () => ({
  __esModule: true,
  default: () => ({ linkSections: [], ready: true }),
}));

jest.mock('../../hooks/useFavoritedServices', () => ({
  __esModule: true,
  default: () => [],
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: () => false,
}));

jest.mock('@scalprum/react-core', () => ({
  __esModule: true,
  ScalprumComponent: () => <div>ScalprumComponent</div>,
  ScalprumProvider: ({ children }: { children: React.ReactNode }) => children,
  useGetState: jest.fn(() => ({ isDark: false })),
}));

jest.mock('@scalprum/core', () => ({
  preloadModule: jest.fn(() => Promise.resolve()),
  createSharedStore: jest.fn(() => ({
    getState: jest.fn(() => ({ isDark: false })),
    updateState: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
  })),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import { Header } from './Header';
import { layoutLightwellHeaderAtom } from '../../state/atoms/releaseAtom';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';
import { describe, expect, it, jest } from '@jest/globals';

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

const mockInternalChromeContext = {
  drawerActions: {
    toggleDrawerContent: jest.fn(),
  },
};

const renderHeader = (lightwellHeader = false) => {
  const store = createStore();
  if (lightwellHeader) {
    store.set(layoutLightwellHeaderAtom, true);
  }

  return {
    store,
    ...render(
      <MemoryRouter>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ChromeAuthContext.Provider value={mockAuthContextValue as any}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <InternalChromeContext.Provider value={mockInternalChromeContext as any}>
            <Provider store={store}>
              <Header />
            </Provider>
          </InternalChromeContext.Provider>
        </ChromeAuthContext.Provider>
      </MemoryRouter>
    ),
  };
};

describe('Header Lightwell mode', () => {
  it('should render AllServicesDropdown with "Red Hat Hybrid Cloud Console" when not in Lightwell mode', () => {
    renderHeader(false);
    expect(screen.getByText('Red Hat Hybrid Cloud Console')).toBeTruthy();
    expect(screen.queryByText('Lightwell')).toBeFalsy();
  });

  it('should render "Lightwell" text instead of AllServicesDropdown when in Lightwell mode', () => {
    renderHeader(true);
    expect(screen.getByText('Lightwell')).toBeTruthy();
    expect(screen.queryByText('Red Hat Hybrid Cloud Console')).toBeFalsy();
  });

  it('should render search toolbar group when not in Lightwell mode', () => {
    renderHeader(false);
    expect(screen.getByTestId('search-toolbar-group')).toBeTruthy();
  });

  it('should hide search toolbar group when in Lightwell mode', () => {
    renderHeader(true);
    expect(screen.queryByTestId('search-toolbar-group')).toBeFalsy();
  });

  it('should render masthead logo as a link when not in Lightwell mode', () => {
    renderHeader(false);
    const logoLink = screen.getByRole('link', { name: /logo/i });
    expect(logoLink).toBeTruthy();
    expect(logoLink.getAttribute('href')).toBe('/');
  });

  it('should render masthead logo without a link when in Lightwell mode', () => {
    renderHeader(true);
    const logoLinks = screen.queryAllByRole('link', { name: /logo/i });
    expect(logoLinks.length).toBe(0);
  });
});
