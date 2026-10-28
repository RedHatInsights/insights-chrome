jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: () => false,
}));

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, jest } from '@jest/globals';

import UserToggle from './UserToggle';
import { buildAccountConsoleUrl, buildCurrentReturnTo } from '../../utils/languageResolution';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../auth/ChromeAuthContext';
import type { UserMenuConfig } from './Header';

const mockUser = {
  entitlements: {},
  identity: {
    account_number: '123456',
    org_id: 'org123',
    type: 'User',
    internal: { org_id: 'org123' },
    user: {
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      is_org_admin: false,
      is_internal: false,
    },
  },
};

const noopAsync = jest.fn<() => Promise<never>>().mockResolvedValue(undefined as never);

const contextValue: ChromeAuthContextValue = {
  ssoUrl: 'https://sso.test.redhat.com',
  ready: true,
  user: mockUser,
  getUser: jest.fn<() => Promise<typeof mockUser>>().mockResolvedValue(mockUser),
  token: 'test-token',
  refreshToken: 'test-refresh-token',
  logoutAllTabs: jest.fn(),
  loginAllTabs: jest.fn(),
  logout: jest.fn(),
  login: jest.fn(),
  tokenExpires: Date.now() + 3600000,
  getToken: jest.fn<() => Promise<string>>().mockResolvedValue('test-token'),
  getRefreshToken: jest.fn<() => Promise<string>>().mockResolvedValue('test-refresh-token'),
  getOfflineToken: noopAsync,
  doOffline: noopAsync,
  reAuthWithScopes: noopAsync,
  forceRefresh: noopAsync,
  loginSilent: noopAsync,
};

const renderUserToggle = (userMenu?: UserMenuConfig) => {
  const result = render(
    <MemoryRouter>
      <IntlProvider locale="en">
        <JotaiProvider>
          <ChromeAuthContext.Provider value={contextValue}>
            <UserToggle userMenu={userMenu} />
          </ChromeAuthContext.Provider>
        </JotaiProvider>
      </IntlProvider>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByText('Test User'));
  return result;
};

describe('UserToggle - userMenu config', () => {
  it('should hide all menu items when no userMenu provided', () => {
    renderUserToggle();
    expect(screen.queryByText('Account details')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should hide all menu items when empty userMenu provided', () => {
    renderUserToggle({});
    expect(screen.queryByText('Account details')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should show all menu items when all flags are true', () => {
    renderUserToggle({ showMyProfile: true, showMyUserAccess: true, showUserPreferences: true, showLogout: true });
    expect(screen.getByText('Account details')).toBeInTheDocument();
    expect(screen.getByText('My User Access')).toBeInTheDocument();
    expect(screen.getByText('User Preferences')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('should show only Account details when showMyProfile is true', () => {
    renderUserToggle({ showMyProfile: true });
    expect(screen.getByText('Account details')).toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should link Account details to the SSO account console with the console return trip, in the same tab', () => {
    renderUserToggle({ showMyProfile: true });
    const profileLink = screen.getByText('Account details').closest('a');
    // The link targets the SSO realm from the auth context, carrying the
    // console return trip.
    expect(profileLink).toHaveAttribute('href', buildAccountConsoleUrl('https://sso.test.redhat.com', buildCurrentReturnTo()));
    // Same tab: no target/rel, and the return URL carries fromAccount=1 so the
    // OIDC return trip re-auths silently when the user comes back.
    expect(profileLink).not.toHaveAttribute('target');
    expect(profileLink).not.toHaveAttribute('rel');
    expect(profileLink?.getAttribute('href')).toContain(encodeURIComponent('fromAccount=1'));
  });

  it('should show only My User Access when showMyUserAccess is true', () => {
    renderUserToggle({ showMyUserAccess: true });
    expect(screen.queryByText('Account details')).not.toBeInTheDocument();
    expect(screen.getByText('My User Access')).toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should show only User Preferences when showUserPreferences is true', () => {
    renderUserToggle({ showUserPreferences: true });
    expect(screen.queryByText('Account details')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.getByText('User Preferences')).toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should show only Log out when showLogout is true', () => {
    renderUserToggle({ showLogout: true });
    expect(screen.queryByText('Account details')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('should show multiple items when multiple flags are true', () => {
    renderUserToggle({ showMyProfile: true, showLogout: true });
    expect(screen.getByText('Account details')).toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('should show only logout when Lightwell config is used', () => {
    renderUserToggle({ showLogout: true });
    expect(screen.queryByText('Account details')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });
});
