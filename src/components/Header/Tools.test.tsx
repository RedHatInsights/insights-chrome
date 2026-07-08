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
const mockToggleGlassTheme = jest.fn();
jest.mock('../../hooks/useGlassTheme', () => ({
  useGlassTheme: () => ({
    isGlassTheme: false,
    toggleGlassTheme: mockToggleGlassTheme,
  }),
}));
const mockSetFeltEnabled = jest.fn();
const mockSetFeltDisabled = jest.fn();
jest.mock('../../hooks/useFeltTheme', () => ({
  useFeltTheme: () => ({
    isFeltTheme: false,
    setFeltEnabled: mockSetFeltEnabled,
    setFeltDisabled: mockSetFeltDisabled,
    forceEnabled: false,
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
    it('should render all three color scheme options as ToggleGroup', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': true,
      });

      expect(screen.getByText('Color scheme')).toBeInTheDocument();
      expect(document.getElementById('color-scheme-system')).toBeInTheDocument();
      expect(document.getElementById('color-scheme-light')).toBeInTheDocument();
      expect(document.getElementById('color-scheme-dark')).toBeInTheDocument();
    });
  });

  describe('when dark mode enabled but system theme disabled', () => {
    it('should render only Light and Dark options', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': false,
      });

      expect(screen.getByText('Color scheme')).toBeInTheDocument();
      expect(document.getElementById('color-scheme-light')).toBeInTheDocument();
      expect(document.getElementById('color-scheme-dark')).toBeInTheDocument();
    });

    it('should not render system option', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': false,
      });

      expect(document.getElementById('color-scheme-system')).not.toBeInTheDocument();
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

    it('should render color scheme ToggleGroupItems when dark mode is enabled', () => {
      renderTools({
        'platform.chrome.dark-mode': true,
        'platform.chrome.dark-mode_system': true,
      });

      expect(document.getElementById('color-scheme-system')).toBeInTheDocument();
      expect(document.getElementById('color-scheme-light')).toBeInTheDocument();
      expect(document.getElementById('color-scheme-dark')).toBeInTheDocument();
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

  describe('glass theme in contrast mode', () => {
    it('should render Glass option in contrast mode when glass flag is enabled', () => {
      renderTools({ 'platform.chrome.glass-theme': true });
      expect(screen.getByText('Contrast mode')).toBeInTheDocument();
      expect(document.getElementById('contrast-glass')).toBeInTheDocument();
    });

    it('should not render Glass option when glass flag is disabled', () => {
      renderTools({ 'platform.chrome.glass-theme': false });
      expect(document.getElementById('contrast-glass')).not.toBeInTheDocument();
    });

    it('should show contrast mode section when only glass flag is enabled', () => {
      renderTools({ 'platform.chrome.glass-theme': true, 'platform.chrome.high-contrast': false });
      expect(screen.getByText('Contrast mode')).toBeInTheDocument();
      expect(document.getElementById('contrast-system')).toBeInTheDocument();
      expect(document.getElementById('contrast-default')).toBeInTheDocument();
      expect(document.getElementById('contrast-glass')).toBeInTheDocument();
      expect(document.getElementById('contrast-high')).not.toBeInTheDocument();
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

  it('should render settings menu by default', () => {
    renderTools();
    expect(screen.getByTestId('PreviewSwitcher')).toBeInTheDocument();
  });

  it('should hide settings menu when toolbarConfig.hideSettings is true', () => {
    renderTools({}, { hideSettings: true });
    expect(screen.queryByTestId('PreviewSwitcher')).not.toBeInTheDocument();
  });

  it('should still render help button when settings is hidden', () => {
    renderTools({}, { hideSettings: true });
    expect(screen.getByLabelText('Help menu')).toBeInTheDocument();
  });

  it('should hide both settings and help when both are true', () => {
    renderTools({}, { hideSettings: true, hideHelp: true });
    expect(screen.queryByTestId('PreviewSwitcher')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Help menu')).not.toBeInTheDocument();
  });

  it('should not render settings or preview switcher in mobile dropdown when hideSettings is true', () => {
    renderTools({}, { hideSettings: true });
    // Neither desktop settings menu nor mobile settings link should appear
    expect(screen.queryAllByText('Settings')).toHaveLength(0);
  });

  it('should render settings link in mobile dropdown by default', () => {
    renderTools();
    // Both desktop settings menu group title (H3) and mobile settings link (SPAN) should appear
    const settingsElements = screen.queryAllByText('Settings');
    expect(settingsElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should not render an orphan separator in mobile dropdown when both settings and help are hidden', () => {
    renderTools({}, { hideSettings: true, hideHelp: true });
    expect(screen.queryAllByText('Settings')).toHaveLength(0);
    expect(screen.queryByText('Support options')).not.toBeInTheDocument();
    expect(screen.queryByText('Status page')).not.toBeInTheDocument();
    // Verify no stray dividers: when both sections empty, no separator items should be in mobile dropdown
    const dividers = document.querySelectorAll('li > hr.pf-v6-c-divider');
    expect(dividers).toHaveLength(0);
  });
});

describe('Tools - high contrast feature flag', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when high contrast is disabled', () => {
    it('should not render contrast mode section when both flags disabled', () => {
      renderTools({ 'platform.chrome.high-contrast': false, 'platform.chrome.glass-theme': false });
      expect(screen.queryByText('Contrast mode')).not.toBeInTheDocument();
    });
  });

  describe('when high contrast is enabled', () => {
    it('should render contrast mode section with toggle group', () => {
      renderTools({ 'platform.chrome.high-contrast': true });

      expect(screen.getByText('Contrast mode')).toBeInTheDocument();
      expect(document.getElementById('contrast-system')).toBeInTheDocument();
      expect(document.getElementById('contrast-default')).toBeInTheDocument();
      expect(document.getElementById('contrast-high')).toBeInTheDocument();
    });

    it('should call setSystemContrast and disableGlass when System is clicked', () => {
      renderTools({ 'platform.chrome.high-contrast': true });
      const systemBtn = document.getElementById('contrast-system');
      fireEvent.click(systemBtn!);
      expect(mockSetSystemContrast).toHaveBeenCalled();
      expect(mockToggleGlassTheme).toHaveBeenCalledWith(undefined, false);
    });

    it('should call setDefaultContrast and disableGlass when Default is clicked', () => {
      renderTools({ 'platform.chrome.high-contrast': true });
      const defaultBtn = document.getElementById('contrast-default');
      fireEvent.click(defaultBtn!);
      expect(mockSetDefaultContrast).toHaveBeenCalled();
      expect(mockToggleGlassTheme).toHaveBeenCalledWith(undefined, false);
    });

    it('should call setHighContrast and disableGlass when High contrast is clicked', () => {
      renderTools({ 'platform.chrome.high-contrast': true });
      const highBtn = document.getElementById('contrast-high');
      fireEvent.click(highBtn!);
      expect(mockSetHighContrast).toHaveBeenCalled();
      expect(mockToggleGlassTheme).toHaveBeenCalledWith(undefined, false);
    });
  });
});

describe('Tools - theme toggle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should always render theme section', () => {
    renderTools();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(document.getElementById('theme-default')).toBeInTheDocument();
    expect(document.getElementById('theme-felt')).toBeInTheDocument();
  });

  it('should call setFeltEnabled when Project Felt is clicked', () => {
    renderTools();
    const feltBtn = document.getElementById('theme-felt');
    fireEvent.click(feltBtn!);
    expect(mockSetFeltEnabled).toHaveBeenCalled();
  });

  it('should call setFeltDisabled when Default is clicked', () => {
    renderTools();
    const defaultBtn = document.getElementById('theme-default');
    fireEvent.click(defaultBtn!);
    expect(mockSetFeltDisabled).toHaveBeenCalled();
  });
});
