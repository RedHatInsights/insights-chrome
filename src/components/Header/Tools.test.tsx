import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';
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
  customContent?: React.ReactNode;
}

interface MockDropdownItemWithClick extends MockDropdownItem {
  onClick?: () => void;
}

interface MockDropdownGroupWithClick extends Omit<MockDropdownGroup, 'items'> {
  items?: MockDropdownItemWithClick[];
}

jest.mock('./SettingsToggle', () => ({
  __esModule: true,
  default: ({ dropdownItems }: { dropdownItems: MockDropdownGroupWithClick[] }) => (
    <div>
      {dropdownItems.map((group, i: number) =>
        group.isHidden ? null : (
          <div key={i}>
            {group.title && <h3>{group.title}</h3>}
            {group.customContent
              ? group.customContent
              : group.items
                  ?.filter((item) => !item.isHidden)
                  .map((item, j: number) => (
                    <div key={j} data-ouia-component-id={item.ouiaId} onClick={item.onClick} role={item.onClick ? 'button' : undefined}>
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
jest.mock('../../hooks/useGlassTheme', () => ({
  useGlassTheme: () => ({
    isGlassTheme: false,
    toggleGlassTheme: jest.fn(),
  }),
}));
const mockSetDefaultContrast = jest.fn();
const mockSetHighContrast = jest.fn();
const mockSetSystemContrast = jest.fn();
jest.mock('../../hooks/useHighContrast', () => ({
  useHighContrast: () => ({
    contrastMode: 0,
    setDefaultContrast: mockSetDefaultContrast,
    setHighContrast: mockSetHighContrast,
    setSystemContrast: mockSetSystemContrast,
  }),
  HighContrastVariants: { default: 0, high: 1, system: 2 },
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
  'platform.chrome.help-panel': false,
  'platform.chrome.ask-redhat-help': false,
  'platform.learning-resources.global-learning-resources': false,
  'platform.chrome.itless': false,
  'platform.chrome.dark-mode': false,
  'platform.chrome.dark-mode_system': false,
  'platform.chrome.glass-theme': false,
  'platform.chrome.high-contrast': false,
  'platform.chrome.notifications-drawer': false,
  'console.chrome-scheduler_drawer': false,
};

const mockInternalChromeContext = {
  drawerActions: { toggleDrawerContent: jest.fn() },
};

import type { ToolbarConfig } from './Header';

const renderTools = (flagOverrides: Partial<typeof defaultFlags> = {}, toolbarConfig?: ToolbarConfig) => {
  const flags = { ...defaultFlags, ...flagOverrides };
  mockedUseFlag.mockImplementation((name: string) => flags[name] ?? false);

  return render(
    <MemoryRouter>
      <IntlProvider locale="en">
        <ChromeAuthContext.Provider value={{ user: mockUser, token: 'test-token' } as any}>
          <InternalChromeContext.Provider value={mockInternalChromeContext as any}>
            <Provider>
              <Tools toolbarConfig={toolbarConfig} />
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

  describe('scheduler drawer feature flag', () => {
    it('should not render Scheduler item when flag is disabled', () => {
      renderTools({ 'console.chrome-scheduler_drawer': false });
      expect(screen.queryByText('Scheduler')).not.toBeInTheDocument();
    });

    it('should render Scheduler item when flag is enabled', () => {
      renderTools({ 'console.chrome-scheduler_drawer': true });
      expect(screen.getByText('Scheduler')).toBeInTheDocument();
      expect(screen.getByTestId('settings-menu-scheduler')).toBeInTheDocument();
    });

    it('should call toggleDrawerContent with schedulerUi scope when clicked', () => {
      renderTools({ 'console.chrome-scheduler_drawer': true });
      const schedulerItem = screen.getByTestId('settings-menu-scheduler');
      fireEvent.click(schedulerItem);
      expect(mockInternalChromeContext.drawerActions.toggleDrawerContent).toHaveBeenCalledWith({
        scope: 'schedulerUi',
        module: './SchedulerPanelContent',
      });
    });
  });

  describe('glass theme toggle', () => {
    it('should render glass effect section when flag is enabled', () => {
      renderTools({ 'platform.chrome.glass-theme': true });
      expect(screen.getByText('Glass effect')).toBeInTheDocument();
      expect(document.getElementById('glass-theme-switch')).toBeInTheDocument();
    });

    it('should not render glass effect section when flag is disabled', () => {
      renderTools({ 'platform.chrome.glass-theme': false });
      expect(screen.queryByText('Glass effect')).not.toBeInTheDocument();
    });
  });
});

describe('Tools - toolbarConfig visibility', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should render help button by default', () => {
    renderTools();
    expect(screen.getByLabelText('Help menu')).toBeInTheDocument();
  });

  it('should hide help button when toolbarConfig.hideHelp is true', () => {
    renderTools({}, { hideHelp: true });
    expect(screen.queryByLabelText('Help menu')).not.toBeInTheDocument();
  });

  it('should still render settings when help is hidden', () => {
    renderTools({}, { hideHelp: true });
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
  });

  it('should render help panel toggle when help-panel flag is enabled', () => {
    renderTools({ 'platform.chrome.help-panel': true });
    expect(screen.getByLabelText('Toggle help panel')).toBeInTheDocument();
  });

  it('should hide help panel toggle when toolbarConfig.hideHelp is true', () => {
    renderTools({ 'platform.chrome.help-panel': true }, { hideHelp: true });
    expect(screen.queryByLabelText('Toggle help panel')).not.toBeInTheDocument();
  });

  it('should not render help items in mobile dropdown when hideHelp is true', () => {
    renderTools({}, { hideHelp: true });
    // Mobile dropdown should exclude aboutMenuDropdownItems when hideHelp is set
    expect(screen.queryByText('Support options')).not.toBeInTheDocument();
    expect(screen.queryByText('Status page')).not.toBeInTheDocument();
  });

  it('should render help items in mobile dropdown by default', () => {
    renderTools();
    // Mobile dropdown includes aboutMenuDropdownItems when hideHelp is not set
    expect(screen.getByText('Support options')).toBeInTheDocument();
    expect(screen.getByText('Status page')).toBeInTheDocument();
  });
});

describe('Tools - high contrast feature flag', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when high contrast is disabled', () => {
    it('should not render contrast section', () => {
      renderTools({ 'platform.chrome.high-contrast': false });
      expect(screen.queryByText('Contrast')).not.toBeInTheDocument();
    });
  });

  describe('when high contrast is enabled', () => {
    it('should render contrast section with toggle group', () => {
      renderTools({ 'platform.chrome.high-contrast': true });

      expect(screen.getByText('Contrast')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('High contrast')).toBeInTheDocument();
    });

    it('should call setSystemContrast when System is clicked', () => {
      renderTools({ 'platform.chrome.high-contrast': true });
      fireEvent.click(screen.getByText('System'));
      expect(mockSetSystemContrast).toHaveBeenCalled();
    });

    it('should call setDefaultContrast when Default is clicked', () => {
      renderTools({ 'platform.chrome.high-contrast': true });
      fireEvent.click(screen.getByText('Default'));
      expect(mockSetDefaultContrast).toHaveBeenCalled();
    });

    it('should call setHighContrast when High contrast is clicked', () => {
      renderTools({ 'platform.chrome.high-contrast': true });
      fireEvent.click(screen.getByText('High contrast'));
      expect(mockSetHighContrast).toHaveBeenCalled();
    });
  });
});
