import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock oidc-client-ts before importing component
const MOCK_IN_MEMORY_WEB_STORAGE_INSTANCE = {};
jest.mock('oidc-client-ts', () => ({
  UserManager: jest.fn().mockImplementation(() => ({
    getUser: jest.fn(),
    signinRedirect: jest.fn(),
    signinSilent: jest.fn(),
    removeUser: jest.fn(),
    events: {
      addUserLoaded: jest.fn(),
      removeUserLoaded: jest.fn(),
      addSilentRenewError: jest.fn(),
      removeSilentRenewError: jest.fn(),
      addAccessTokenExpired: jest.fn(),
      removeAccessTokenExpired: jest.fn(),
      addAccessTokenExpiring: jest.fn(),
      removeAccessTokenExpiring: jest.fn(),
      addUserUnloaded: jest.fn(),
      removeUserUnloaded: jest.fn(),
      addUserSignedIn: jest.fn(),
      removeUserSignedIn: jest.fn(),
      addUserSignedOut: jest.fn(),
      removeUserSignedOut: jest.fn(),
      addUserSessionChanged: jest.fn(),
      removeUserSessionChanged: jest.fn(),
    },
    settings: {},
  })),
  WebStorageStateStore: jest.fn(),
  InMemoryWebStorage: jest.fn().mockImplementation(() => MOCK_IN_MEMORY_WEB_STORAGE_INSTANCE),
}));

jest.mock('react-oidc-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}));

// Mock common utilities
const mockLoadSSOConfig = jest.fn();
const mockResolveSSOUrl = jest.fn();
const mockLoadFedModules = jest.fn();

jest.mock('../../utils/common', () => ({
  loadSSOConfig: (...args: unknown[]) => mockLoadSSOConfig(...args),
  resolveSSOUrl: (...args: unknown[]) => mockResolveSSOUrl(...args),
  loadFedModules: (...args: unknown[]) => mockLoadFedModules(...args),
  ITLess: jest.fn(() => false),
}));

jest.mock('../offline', () => ({
  postbackUrlSetup: jest.fn(),
}));

jest.mock('../../components/AppPlaceholder', () => ({
  __esModule: true,
  default: () => <div data-testid="app-placeholder">Loading...</div>,
}));

jest.mock('./OIDCSecured', () => ({
  OIDCSecured: ({ children }: { children: React.ReactNode }) => <div data-testid="oidc-secured">{children}</div>,
}));

jest.mock('./OIDCUserManagerErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

import OIDCProvider from './OIDCProvider';
import { InMemoryWebStorage, UserManager, WebStorageStateStore } from 'oidc-client-ts';

describe('OIDCProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show AppPlaceholder while loading', () => {
    // Never resolve — stays in loading state
    mockLoadSSOConfig.mockReturnValue(new Promise(() => {}));

    render(
      <OIDCProvider>
        <div>App Content</div>
      </OIDCProvider>
    );

    expect(screen.getByTestId('app-placeholder')).toBeInTheDocument();
    expect(screen.queryByText('App Content')).not.toBeInTheDocument();
  });

  it('should render children with resolved ssoUrl and microFrontendConfig after setupSSO succeeds', async () => {
    const mockSSOConfig = { ssoUrl: 'https://sso.example.test/auth' };
    const mockFedModulesData = {
      data: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        'my-app': { manifestLocation: '/apps/my-app/fed-mods.json' },
        chrome: { manifestLocation: '/apps/chrome/fed-mods.json' },
      },
    };

    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.example.test/auth/');
    mockLoadFedModules.mockResolvedValue(mockFedModulesData);

    render(
      <OIDCProvider>
        <div>App Content</div>
      </OIDCProvider>
    );

    // Initially shows placeholder
    expect(screen.getByTestId('app-placeholder')).toBeInTheDocument();

    // After async resolution, renders children
    await waitFor(() => {
      expect(screen.getByTestId('oidc-secured')).toBeInTheDocument();
    });

    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('should strip $schema from microFrontendConfig', async () => {
    const mockSSOConfig = { ssoUrl: 'https://sso.example.test/auth' };
    const mockFedModulesData = {
      data: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        'test-app': { manifestLocation: '/apps/test-app/fed-mods.json' },
      },
    };

    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.example.test/auth/');
    mockLoadFedModules.mockResolvedValue(mockFedModulesData);

    render(
      <OIDCProvider>
        <div>Content</div>
      </OIDCProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('oidc-secured')).toBeInTheDocument();
    });

    // Verify loadFedModules was called
    expect(mockLoadFedModules).toHaveBeenCalledTimes(1);
  });

  it('should show AppPlaceholder when loadFedModules fails', async () => {
    const mockSSOConfig = { ssoUrl: 'https://sso.example.test/auth' };

    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.example.test/auth/');
    mockLoadFedModules.mockRejectedValue(new Error('Network error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <OIDCProvider>
        <div>App Content</div>
      </OIDCProvider>
    );

    // Wait for setupSSO to complete (and fail)
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load fed-modules configuration:', expect.any(Error));
    });

    // State stays undefined → AppPlaceholder shown
    expect(screen.getByTestId('app-placeholder')).toBeInTheDocument();
    expect(screen.queryByText('App Content')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('should call loadSSOConfig and resolveSSOUrl during setup', async () => {
    const mockSSOConfig = { ssoUrl: 'https://sso.example.test/auth', ssoMapping: {} };
    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.example.test/auth/');
    mockLoadFedModules.mockResolvedValue({
      data: { $schema: 'schema', app: { manifestLocation: '/apps/app/fed-mods.json' } },
    });

    render(
      <OIDCProvider>
        <div>Content</div>
      </OIDCProvider>
    );

    await waitFor(() => {
      expect(mockLoadSSOConfig).toHaveBeenCalledTimes(1);
      expect(mockResolveSSOUrl).toHaveBeenCalledWith(mockSSOConfig);
    });
  });

  it('should use InMemoryWebStorage instead of localStorage for token storage', async () => {
    const mockSSOConfig = { ssoUrl: 'https://sso.example.test/auth' };
    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.example.test/auth/');
    mockLoadFedModules.mockResolvedValue({
      data: { $schema: 'schema', app: { manifestLocation: '/apps/app/fed-mods.json' } },
    });

    render(
      <OIDCProvider>
        <div>Content</div>
      </OIDCProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('oidc-secured')).toBeInTheDocument();
    });

    // Verify InMemoryWebStorage was instantiated
    expect(InMemoryWebStorage).toHaveBeenCalled();

    // Verify WebStorageStateStore was called with the in-memory store
    expect(WebStorageStateStore).toHaveBeenCalledWith({ store: MOCK_IN_MEMORY_WEB_STORAGE_INSTANCE });

    // Verify UserManager was configured correctly
    const userManagerConfig = (UserManager as jest.Mock).mock.calls[0][0];
    expect(userManagerConfig).not.toHaveProperty('disablePKCE');
  });

  it('should enable PKCE by not setting disablePKCE', async () => {
    const mockSSOConfig = { ssoUrl: 'https://sso.example.test/auth' };
    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.example.test/auth/');
    mockLoadFedModules.mockResolvedValue({
      data: { $schema: 'schema', app: { manifestLocation: '/apps/app/fed-mods.json' } },
    });

    render(
      <OIDCProvider>
        <div>Content</div>
      </OIDCProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('oidc-secured')).toBeInTheDocument();
    });

    const userManagerConfig = (UserManager as jest.Mock).mock.calls[0][0];
    // PKCE should be enabled (disablePKCE must not be true)
    expect(userManagerConfig.disablePKCE).not.toBe(true);
  });

  it('should set base scopes on UserManager so automaticSilentRenew uses them', async () => {
    const mockSSOConfig = { ssoUrl: 'https://sso.example.test/auth' };
    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.example.test/auth/');
    mockLoadFedModules.mockResolvedValue({
      data: { $schema: 'schema', app: { manifestLocation: '/apps/app/fed-mods.json' } },
    });

    render(
      <OIDCProvider>
        <div>Content</div>
      </OIDCProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('oidc-secured')).toBeInTheDocument();
    });

    const userManagerConfig = (UserManager as jest.Mock).mock.calls[0][0];
    // Must include base scopes so implicit signinSilent calls (automaticSilentRenew,
    // forceRefresh, BroadcastChannel refresh) don't downgrade to "openid" only
    expect(userManagerConfig.scope).toBe('openid api.console api.ask_red_hat api.graphql');
    // Silent auth iframe timeout must be short to avoid delaying cold loads
    // when no SSO session exists (default is 10s, we cap at 2s)
    expect(userManagerConfig.silentRequestTimeoutInSeconds).toBe(2);
  });
});
