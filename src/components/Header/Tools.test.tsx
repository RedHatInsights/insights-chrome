import React from 'react';
import { act, configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import Tools from './Tools';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import InternalChromeContext from '../../utils/internalChromeContext';
import { useFlag } from '@unleash/proxy-client-react';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';

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
            {group.items
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
const mockSetLightMode = jest.fn();
const mockSetDarkMode = jest.fn();
const mockSetSystemMode = jest.fn();
const mockUseTheme = jest.fn();

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme(),
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
  'console.chrome-scheduler_drawer': false,
};

const mockInternalChromeContext = {
  drawerActions: { toggleDrawerContent: jest.fn() },
};

const renderTools = (flagOverrides: Partial<typeof defaultFlags> = {}, isPreview = false, themeMode = 0) => {
  const flags = { ...defaultFlags, ...flagOverrides };
  mockedUseFlag.mockImplementation((name: string) => flags[name] ?? false);

  // Set up theme mock
  mockUseTheme.mockReturnValue({
    themeMode,
    setLightMode: mockSetLightMode,
    setDarkMode: mockSetDarkMode,
    setSystemMode: mockSetSystemMode,
  });

  const store = createStore();
  store.set(isPreviewAtom, isPreview);

  return render(
    <MemoryRouter>
      <IntlProvider locale="en">
        <ChromeAuthContext.Provider value={{ user: mockUser, token: 'test-token' } as any}>
          <InternalChromeContext.Provider value={mockInternalChromeContext as any}>
            <Provider store={store}>
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

  describe('help panel icon switching', () => {
    let matchMediaMock: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      // Clean up any theme classes before each test
      document.documentElement.classList.remove('pf-v6-theme-dark');

      // Mock matchMedia
      matchMediaMock = jest.fn();
      window.matchMedia = matchMediaMock;
    });

    it('should render light mode AI icon when help panel is enabled, preview mode is on, and theme is light', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      renderTools({ 'platform.chrome.help-panel': true }, true);

      const iconImg = screen.getByAltText('AI Experience') as HTMLImageElement;
      expect(iconImg).toBeInTheDocument();
      expect(iconImg.src).toContain('rh-ui-icon-ai-experience.svg');
      expect(iconImg.src).not.toContain('rh-ui-icon-ai-experience-dark.svg');
    });

    it('should render dark mode AI icon when help panel is enabled, preview mode is on, and dark theme is active', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      // Simulate dark mode by adding the class
      document.documentElement.classList.add('pf-v6-theme-dark');

      renderTools({ 'platform.chrome.help-panel': true }, true);

      const iconImg = screen.getByAltText('AI Experience') as HTMLImageElement;
      expect(iconImg).toBeInTheDocument();
      expect(iconImg.src).toContain('rh-ui-icon-ai-experience-dark.svg');
    });

    it('should not render AI icon when help panel is enabled but preview mode is off', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      renderTools({ 'platform.chrome.help-panel': true }, false);

      expect(screen.queryByAltText('AI Experience')).not.toBeInTheDocument();
    });

    it('should render help panel toggle button when feature flag is enabled', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      renderTools({ 'platform.chrome.help-panel': true }, true);

      const helpButton = screen.getByTestId('chrome-help-panel');
      expect(helpButton).toBeInTheDocument();
      expect(helpButton).toHaveAttribute('aria-label', 'Toggle help panel');
    });

    it('should call toggleDrawerContent when help panel toggle is clicked', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      renderTools({ 'platform.chrome.help-panel': true }, true);

      const helpButton = screen.getByTestId('chrome-help-panel');
      fireEvent.click(helpButton);

      expect(mockInternalChromeContext.drawerActions.toggleDrawerContent).toHaveBeenCalledWith({
        scope: 'learningResources',
        module: './HelpPanel',
      });
    });

    it('should listen to system preference changes when in system mode', () => {
      const addEventListenerMock = jest.fn();
      const removeEventListenerMock = jest.fn();

      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      });

      // Set theme mode to system
      const { unmount } = renderTools({ 'platform.chrome.help-panel': true }, true, 2); // ThemeVariants.system

      // Verify event listener was added
      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));

      // Cleanup and verify event listener was removed
      unmount();
      expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update icon when system preference changes in system mode', async () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;
      const addEventListenerMock = jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      });

      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: jest.fn(),
      });

      // Set theme mode to system
      renderTools({ 'platform.chrome.help-panel': true }, true, 2); // ThemeVariants.system

      // Initially light
      let iconImg = screen.getByAltText('AI Experience') as HTMLImageElement;
      expect(iconImg.src).toContain('rh-ui-icon-ai-experience.svg');

      // Simulate system changing to dark
      document.documentElement.classList.add('pf-v6-theme-dark');
      await act(async () => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      // Wait for icon to update
      await waitFor(() => {
        iconImg = screen.getByAltText('AI Experience') as HTMLImageElement;
        expect(iconImg.src).toContain('rh-ui-icon-ai-experience-dark.svg');
      });
    });

    it('should not update icon on system preference change when not in system mode', async () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;
      const addEventListenerMock = jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      });

      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: jest.fn(),
      });

      // Set theme mode to light (not system)
      renderTools({ 'platform.chrome.help-panel': true }, true, 0); // ThemeVariants.light

      // Initially light
      let iconImg = screen.getByAltText('AI Experience') as HTMLImageElement;
      expect(iconImg.src).toContain('rh-ui-icon-ai-experience.svg');

      // Simulate system preference changing (but theme is not in system mode)
      await act(async () => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      // Icon should remain light because we're not in system mode
      // The handler should not trigger checkDarkMode when not in system mode
      iconImg = screen.getByAltText('AI Experience') as HTMLImageElement;
      expect(iconImg.src).toContain('rh-ui-icon-ai-experience.svg');
    });

    it('should update dark theme state when component mounts with dark theme active', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      });

      // Set dark theme before rendering
      document.documentElement.classList.add('pf-v6-theme-dark');

      renderTools({ 'platform.chrome.help-panel': true }, true, 1); // ThemeVariants.dark

      // Should detect dark theme on mount
      const iconImg = screen.getByAltText('AI Experience') as HTMLImageElement;
      expect(iconImg.src).toContain('rh-ui-icon-ai-experience-dark.svg');
    });
  });
});
