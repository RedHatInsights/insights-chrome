import React from 'react';
import { configure, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import Tools from './Tools';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';
import { useFlag } from '@unleash/proxy-client-react';

// Configure data-ouia-component-id as the test ID attribute
// This allows using screen.getByTestId/queryByTestId for OUIA IDs
configure({ testIdAttribute: 'data-ouia-component-id' });

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => false),
}));
jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: () => <div />,
}));
jest.mock('./UserToggle', () => ({
  __esModule: true,
  default: ({ extraItems }: { extraItems?: React.ReactNode }) => <div>{extraItems}</div>,
}));
interface MockDropdownItem {
  title: React.ReactNode;
  description?: React.ReactNode;
  isHidden?: boolean;
  ouiaId?: string;
}

interface MockDropdownGroup {
  title?: string;
  isHidden?: boolean;
  items?: MockDropdownItem[];
}

jest.mock('./SettingsToggle', () => ({
  __esModule: true,
  default: ({ dropdownItems }: { dropdownItems: MockDropdownGroup[] }) => (
    <div>
      {dropdownItems.map((group, i: number) =>
        group.isHidden ? null : (
          <div key={i}>
            {group.title && <h3>{group.title}</h3>}
            {group.items
              ?.filter((item) => !item.isHidden)
              .map((item, j: number) => (
                <div key={j} data-ouia-component-id={item.ouiaId}>
                  {item.title}
                  {item.description && <p>{item.description}</p>}
                </div>
              ))}
          </div>
        )
      )}
    </div>
  ),
}));
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    themeMode: 0,
    setLightMode: jest.fn(),
    setDarkMode: jest.fn(),
    setSystemMode: jest.fn(),
  }),
  ThemeVariants: { light: 0, dark: 1, system: 2 },
}));
jest.mock('../../hooks/useSupportCaseData', () => ({
  __esModule: true,
  default: () => ({}),
}));

const mockedUseFlag = useFlag as unknown as jest.Mock;

const mockUser = {
  identity: {
    account_number: '123456',
    user: { username: 'test-user', email: 'test@example.com', is_internal: false, is_org_admin: false },
    internal: { org_id: '789', account_id: '456' },
  },
  entitlements: {},
};

const defaultFlags: Record<string, boolean> = {
  'platform.sources.integrations': false,
  'platform.rbac.workspaces': false,
  'platform.rbac.workspaces-list': false,
  'platform.chrome.help-panel': false,
  'platform.chrome.ask-redhat-help': false,
  'platform.learning-resources.global-learning-resources': false,
  'platform.chrome.itless': false,
  'platform.chrome.dark-mode': false,
  'platform.chrome.dark-mode_system': false,
  'platform.chrome.notifications-drawer': false,
};

const mockInternalChromeContext = {
  drawerActions: { toggleDrawerContent: jest.fn() },
};

const renderTools = (flagOverrides: Partial<typeof defaultFlags> = {}) => {
  const flags = { ...defaultFlags, ...flagOverrides };
  mockedUseFlag.mockImplementation((name: string) => flags[name] ?? false);

  return render(
    <MemoryRouter>
      <IntlProvider locale="en">
        <ChromeAuthContext.Provider value={{ user: mockUser, token: 'test-token' } as any}>
          <InternalChromeContext.Provider value={mockInternalChromeContext as any}>
            <Provider>
              <Tools />
            </Provider>
          </InternalChromeContext.Provider>
        </ChromeAuthContext.Provider>
      </IntlProvider>
    </MemoryRouter>
  );
};

describe('Tools - dark mode system feature flag', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when dark mode is disabled', () => {
    it('should not render color scheme section', () => {
      renderTools({ 'platform.chrome.dark-mode': false });
      expect(screen.queryByText('Color scheme')).not.toBeInTheDocument();
    });
  });

  describe('when dark mode enabled and system theme enabled', () => {
    it('should render all three theme options', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': true,
      });

      expect(screen.getByText('Color scheme')).toBeInTheDocument();
      expect(screen.getByText('Follow system preference')).toBeInTheDocument();
      expect(screen.getByText('Always use light mode')).toBeInTheDocument();
      expect(screen.getByText('Always use dark mode')).toBeInTheDocument();
    });
  });

  describe('when dark mode enabled but system theme disabled', () => {
    it('should render only Light and Dark options', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': false,
      });

      expect(screen.getByText('Color scheme')).toBeInTheDocument();
      expect(screen.getByText('Always use light mode')).toBeInTheDocument();
      expect(screen.getByText('Always use dark mode')).toBeInTheDocument();
    });

    it('should not render system option', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': false,
      });

      expect(screen.queryByText('Follow system preference')).not.toBeInTheDocument();
    });
  });

  describe('settings menu structure', () => {
    it('should render Settings and IAM groups', () => {
      renderTools({ 'platform.chrome.dark-mode': true });

      expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Identity and Access Management')).toBeInTheDocument();
    });
  });

  describe('settings menu OUIA IDs', () => {
    it('should have OUIA ID on preview toggle', () => {
      renderTools();
      expect(screen.getByTestId('PreviewSwitcher')).toBeInTheDocument();
    });

    it('should have OUIA IDs on color scheme options when dark mode is enabled', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': true,
      });

      expect(screen.getByTestId('settings-menu-color-system')).toBeInTheDocument();
      expect(screen.getByTestId('settings-menu-color-light')).toBeInTheDocument();
      expect(screen.getByTestId('settings-menu-color-dark')).toBeInTheDocument();
    });

    it('should have OUIA IDs on Settings menu items', () => {
      renderTools();

      expect(screen.getByTestId('settings-menu-integrations')).toBeInTheDocument();
      expect(screen.getByTestId('settings-menu-notifications')).toBeInTheDocument();
    });

    it('should have OUIA IDs on IAM menu items', () => {
      renderTools();

      expect(screen.getByTestId('UserAccess')).toBeInTheDocument();
      expect(screen.getByTestId('settings-menu-identity-provider')).toBeInTheDocument();
      expect(screen.getByTestId('settings-menu-auth-factors')).toBeInTheDocument();
      expect(screen.getByTestId('settings-menu-service-accounts')).toBeInTheDocument();
    });

    it('should not render integrations OUIA ID when ITLess is enabled', () => {
      renderTools({ 'platform.chrome.itless': true });

      expect(screen.queryByTestId('settings-menu-integrations')).not.toBeInTheDocument();
    });
  });
});
