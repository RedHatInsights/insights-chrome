jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: () => false,
}));

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, jest } from '@jest/globals';

import UserToggle from '../UserToggle';
import ChromeAuthContext from '../../../auth/ChromeAuthContext';
import { activeModuleAtom } from '../../../state/atoms/activeModuleAtom';
import { moduleRoutesAtom } from '../../../state/atoms/chromeModuleAtom';
import { triggerNavListenersAtom } from '../../../state/atoms/activeAppAtom';
import type { UserMenuConfig } from '../Header';

const HydrateAtoms = ({ initialValues, children }: { initialValues: [any, any][]; children: React.ReactNode }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const defaultAtomValues: [any, any][] = [
  [activeModuleAtom, 'testModule'],
  [moduleRoutesAtom, []],
  [triggerNavListenersAtom, jest.fn()],
];

const mockUser = {
  identity: {
    account_number: '123456',
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

const contextValue = {
  user: mockUser,
  logout: jest.fn(),
};

const renderUserToggle = (userMenu?: UserMenuConfig) => {
  const result = render(
    <MemoryRouter>
      <IntlProvider locale="en">
        <JotaiProvider>
          <HydrateAtoms initialValues={defaultAtomValues}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <ChromeAuthContext.Provider value={contextValue as any}>
              <UserToggle userMenu={userMenu} />
            </ChromeAuthContext.Provider>
          </HydrateAtoms>
        </JotaiProvider>
      </IntlProvider>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByText('Test User'));
  return result;
};

describe('UserToggle - userMenu config', () => {
  it('should show all menu items when no userMenu provided', () => {
    renderUserToggle();
    expect(screen.getByText('My profile')).toBeInTheDocument();
    expect(screen.getByText('My User Access')).toBeInTheDocument();
    expect(screen.getByText('User Preferences')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('should hide all menu items when empty userMenu provided', () => {
    renderUserToggle({});
    expect(screen.queryByText('My profile')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should show only My Profile when showMyProfile is true', () => {
    renderUserToggle({ showMyProfile: true });
    expect(screen.getByText('My profile')).toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should show only My User Access when showMyUserAccess is true', () => {
    renderUserToggle({ showMyUserAccess: true });
    expect(screen.queryByText('My profile')).not.toBeInTheDocument();
    expect(screen.getByText('My User Access')).toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should show only User Preferences when showUserPreferences is true', () => {
    renderUserToggle({ showUserPreferences: true });
    expect(screen.queryByText('My profile')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.getByText('User Preferences')).toBeInTheDocument();
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  it('should show only Log out when showLogout is true', () => {
    renderUserToggle({ showLogout: true });
    expect(screen.queryByText('My profile')).not.toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('should show multiple items when multiple flags are true', () => {
    renderUserToggle({ showMyProfile: true, showLogout: true });
    expect(screen.getByText('My profile')).toBeInTheDocument();
    expect(screen.queryByText('My User Access')).not.toBeInTheDocument();
    expect(screen.queryByText('User Preferences')).not.toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });
});
