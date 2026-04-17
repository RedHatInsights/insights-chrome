import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import UserToggle from './UserToggle';

jest.mock('@unleash/proxy-client-react', () => ({
  __esModule: true,
  useFlag: () => false,
  useVariant: () => ({ name: 'enabled', enabled: true }),
  useFlagsStatus: () => ({ flagsReady: true, flagsError: null }),
  useUnleashClient: () => ({}),
  useUnleashContext: () => ({}),
  FlagProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const createMockAuthContext = (overrides: Record<string, unknown> = {}) =>
  ({
    ready: true,
    logout: jest.fn(),
    login: jest.fn(),
    loginAllTabs: jest.fn(),
    logoutAllTabs: jest.fn(),
    tokenExpires: 0,
    doOffline: jest.fn(),
    getOfflineToken: jest.fn(),
    getToken: jest.fn(),
    ssoUrl: '',
    user: {
      entitlements: {},
      identity: {
        org_id: '123',
        type: 'User',
        account_number: '540155',
        internal: {
          org_id: '123',
          account_id: '456',
        },
        user: {
          is_active: true,
          is_org_admin: false,
          is_internal: false,
          locale: 'en_US',
          username: 'jdoe',
          email: 'jdoe@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
        ...overrides,
      },
    },
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const renderWithProviders = (authContext: ReturnType<typeof createMockAuthContext>) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en">
        <ChromeAuthContext.Provider value={authContext}>
          <UserToggle />
        </ChromeAuthContext.Provider>
      </IntlProvider>
    </MemoryRouter>
  );

const openDropdown = async () => {
  const user = userEvent.setup();
  const toggle = screen.getByText('John Doe');
  await act(async () => {
    await user.click(toggle);
  });
};

describe('UserToggle', () => {
  it('should render the toggle with user name', () => {
    const ctx = createMockAuthContext();
    renderWithProviders(ctx);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render account name when organization.name is provided', async () => {
    const ctx = createMockAuthContext({ organization: { name: 'Acme Corp' } });
    renderWithProviders(ctx);
    await openDropdown();
    expect(screen.getByText('Account name:')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('should not render account name when organization is undefined', async () => {
    const ctx = createMockAuthContext();
    renderWithProviders(ctx);
    await openDropdown();
    expect(screen.queryByText('Account name:')).not.toBeInTheDocument();
  });

  it('should not render account name when organization.name is undefined', async () => {
    const ctx = createMockAuthContext({ organization: {} });
    renderWithProviders(ctx);
    await openDropdown();
    expect(screen.queryByText('Account name:')).not.toBeInTheDocument();
  });

  it('should render account number and org ID', async () => {
    const ctx = createMockAuthContext();
    renderWithProviders(ctx);
    await openDropdown();
    expect(screen.getByText('540155')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should render username in dropdown', async () => {
    const ctx = createMockAuthContext();
    renderWithProviders(ctx);
    await openDropdown();
    expect(screen.getByText('jdoe')).toBeInTheDocument();
  });

  it('should show Org. Administrator badge for org admins', async () => {
    const ctx = createMockAuthContext();
    ctx.user.identity.user.is_org_admin = true;
    renderWithProviders(ctx);
    await openDropdown();
    expect(screen.getByText('Org. Administrator')).toBeInTheDocument();
  });

  it('should render account name between username and account number', async () => {
    const ctx = createMockAuthContext({ organization: { name: 'Test Org' } });
    renderWithProviders(ctx);
    await openDropdown();

    const allTerms = document.querySelectorAll('.pf-v6-c-description-list__term');
    const termTexts = Array.from(allTerms).map((t) => t.textContent?.trim());
    expect(termTexts[0]).toContain('Username:');
    expect(termTexts[1]).toBe('Account name:');
    expect(termTexts[2]).toContain('Account number:');
  });
});
