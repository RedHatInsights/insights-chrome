import React from 'react';
import Tools from '../Tools';
import { ScalprumProvider } from '@scalprum/react-core';
import { act, render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import InternalChromeContext from '../../../utils/internalChromeContext';
import ChromeAuthContext from '../../../auth/ChromeAuthContext';

jest.mock('../UserToggle', () => () => '<UserToggle />');
jest.mock('../ToolbarToggle', () => () => '<ToolbarToggle />');
jest.mock('../SettingsToggle', () => {
  const MockSettingsToggle = (props) => {
    return (
      <>
        <button id={props.id} aria-label={props.ariaLabel} onClick={() => props.setIsOpen && props.setIsOpen(true)} data-testid="settings-toggle">
          Settings
        </button>
        <div>
          {props.dropdownItems.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.items.map((item, itemIndex) => (
                <a key={itemIndex} href={item.url} data-testid={item.ouiaId}>
                  {item.title}
                </a>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  };
  MockSettingsToggle.displayName = 'MockSettingsToggle';
  return MockSettingsToggle;
});
jest.mock('@scalprum/react-core', () => ({
  __esModule: true,
  ScalprumComponent: () => <div>ScalprumComponent</div>,
  ScalprumProvider: ({ children }) => children,
}));
jest.mock('../../../state/atoms/releaseAtom', () => {
  const util = jest.requireActual('../../../state/atoms/utils');
  return {
    __esModule: true,
    isPreviewAtom: util.atomWithToggle(false),
    togglePreviewWithCheckAtom: util.atomWithToggle(false),
  };
});

let mockFlagValues = {};

jest.mock('@unleash/proxy-client-react', () => ({
  __esModule: true,
  useFlag: (flagName) => {
    return mockFlagValues[flagName] !== undefined ? mockFlagValues[flagName] : true;
  },
  useVariant: () => ({ name: 'enabled', enabled: true }),
  useFlagsStatus: () => ({ flagsReady: true, flagsError: null }),
  useUnleashClient: () => ({}),
  useUnleashContext: () => ({}),
  FlagProvider: ({ children }) => children,
}));

const mockInternalChromeContext = {
  drawerActions: {
    toggleDrawerContent: jest.fn(),
  },
};

// Shared mock auth context factory
const createMockAuthContext = (overrides = {}) => ({
  ready: true,
  user: {
    identity: {
      user: {
        is_org_admin: true,
        is_internal: false,
        username: 'testuser',
        email: 'test@example.com',
        ...overrides.user,
      },
      org_id: 'org123',
      account_number: 'acc123',
      ...overrides.identity,
    },
    ...overrides.userRoot,
  },
  token: 'mock-token',
  ...overrides.root,
});

beforeAll(() => {
  global.__webpack_init_sharing__ = () => undefined;
  global.__webpack_share_scopes__ = { default: {} };
});

describe('Tools', () => {
  let assignMock = jest.fn();

  delete window.location;
  window.location = { assign: assignMock, href: '', pathname: '' };

  beforeEach(() => {
    mockFlagValues = {};
  });

  afterEach(() => {
    assignMock.mockClear();
  });

  const renderTools = async (authContextValue) => {
    let container;
    await act(async () => {
      container = render(
        <MemoryRouter>
          <ScalprumProvider config={{ notifications: { manifestLocation: '/apps/notifications/fed-mods.json' } }}>
            <JotaiProvider>
              <ChromeAuthContext.Provider value={authContextValue}>
                <InternalChromeContext.Provider value={mockInternalChromeContext}>
                  <Tools />
                </InternalChromeContext.Provider>
              </ChromeAuthContext.Provider>
            </JotaiProvider>
          </ScalprumProvider>
        </MemoryRouter>
      ).container;
    });
    return container;
  };

  it('should render correctly', async () => {
    const mockClick = jest.fn();
    let container;
    await act(async () => {
      container = render(
        <MemoryRouter>
          <ScalprumProvider config={{ notifications: { manifestLocation: '/apps/notifications/fed-mods.json' } }}>
            <JotaiProvider>
              <InternalChromeContext.Provider value={mockInternalChromeContext}>
                <Tools onClick={mockClick} />
              </InternalChromeContext.Provider>
            </JotaiProvider>
          </ScalprumProvider>
        </MemoryRouter>
      ).container;
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  describe('identityAndAccessManagmentPath routing', () => {
    it('should use /iam/overview for org admin with workspaces enabled', async () => {
      mockFlagValues['platform.rbac.workspaces'] = true;

      const mockAuthContext = createMockAuthContext({
        user: { is_org_admin: true },
      });

      await renderTools(mockAuthContext);

      // Open the settings dropdown
      const settingsButton = screen.getByRole('button', { name: 'Settings menu' });
      expect(settingsButton).toBeInTheDocument();

      await act(async () => {
        settingsButton.click();
      });

      // Check that the link with correct href exists (note: "Acess" is a typo in the source code)
      const iamLink = screen.getByRole('link', { name: /Acess management/i });
      expect(iamLink).toBeInTheDocument();
      expect(iamLink).toHaveAttribute('href', '/iam/overview');
    });

    it('should use /iam/user-access/overview for org admin with workspaces disabled', async () => {
      mockFlagValues['platform.rbac.workspaces'] = false;

      const mockAuthContext = createMockAuthContext({
        user: { is_org_admin: true },
      });

      await renderTools(mockAuthContext);

      // Open the settings dropdown
      const settingsButton = screen.getByRole('button', { name: 'Settings menu' });
      expect(settingsButton).toBeInTheDocument();

      await act(async () => {
        settingsButton.click();
      });

      // Check that the link with correct href exists
      const iamLink = screen.getByRole('link', { name: /User Access/i });
      expect(iamLink).toBeInTheDocument();
      expect(iamLink).toHaveAttribute('href', '/iam/user-access/overview');
    });

    it('should use /iam/my-user-access for non-org-admin', async () => {
      mockFlagValues['platform.rbac.workspaces'] = true;

      const mockAuthContext = createMockAuthContext({
        user: { is_org_admin: false },
      });

      await renderTools(mockAuthContext);

      // Open the settings dropdown
      const settingsButton = screen.getByRole('button', { name: 'Settings menu' });
      expect(settingsButton).toBeInTheDocument();

      await act(async () => {
        settingsButton.click();
      });

      // Check that the link with correct href exists
      const iamLink = screen.getByRole('link', { name: /My User Access/i });
      expect(iamLink).toBeInTheDocument();
      expect(iamLink).toHaveAttribute('href', '/iam/my-user-access');
    });
  });
});
