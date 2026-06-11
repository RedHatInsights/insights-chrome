import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock oidc-client-ts before importing component
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
    const mockSSOConfig = { ssoUrl: 'https://sso.stage.redhat.com/auth' };
    const mockFedModulesData = {
      data: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        'my-app': { manifestLocation: '/apps/my-app/fed-mods.json' },
        chrome: { manifestLocation: '/apps/chrome/fed-mods.json' },
      },
    };

    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.stage.redhat.com/auth/');
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
    const mockSSOConfig = { ssoUrl: 'https://sso.stage.redhat.com/auth' };
    const mockFedModulesData = {
      data: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        'test-app': { manifestLocation: '/apps/test-app/fed-mods.json' },
      },
    };

    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.stage.redhat.com/auth/');
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
    const mockSSOConfig = { ssoUrl: 'https://sso.stage.redhat.com/auth' };

    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.stage.redhat.com/auth/');
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
    const mockSSOConfig = { ssoUrl: 'https://sso.redhat.com/auth', ssoMapping: {} };
    mockLoadSSOConfig.mockResolvedValue(mockSSOConfig);
    mockResolveSSOUrl.mockReturnValue('https://sso.redhat.com/auth/');
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
});
