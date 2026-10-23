import React, { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { OIDCSecured } from './OIDCSecured';
import { RH_USER_ID_STORAGE_KEY } from '../../utils/consts';
import { AuthContextProps } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import { AxiosError } from 'axios';
import ChromeAuthContext, { ChromeAuthContextValue } from '../ChromeAuthContext';
import { createFetchPermissionsWatcher, resetPermissionCache } from '../fetchPermissions';

jest.unmock('axios');
const permissionRequest = jest.fn();
const entitlementRequest = jest.fn();
jest.mock('../rbac', () => () => ({ getPrincipalAccess: (...args: unknown[]) => permissionRequest(...args) }));
jest.mock('../entitlementsApi', () => () => ({ servicesGet: () => entitlementRequest() }));
jest.mock('../../utils/iqeEnablement', () => ({ init: jest.fn() }));
jest.mock('../../utils/sentry', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../components/FeatureFlags/unleashClient', () => ({ unleashClientExists: () => false }));

// Mock setCookie to observe calls from the effect under test
jest.mock('../setCookie', () => ({
  setCookie: jest.fn(),
}));

// Minimal mocks to avoid unrelated side-effects during render
jest.mock('broadcast-channel', () => {
  const channel = { postMessage: jest.fn(), close: jest.fn() };
  return { BroadcastChannel: jest.fn(() => channel), channel };
});

jest.mock('react-oidc-context', () => ({
  hasAuthParams: jest.fn(() => false),
  useAuth: jest.fn(),
}));

jest.mock('./utils', () => ({
  login: jest.fn(),
  logout: jest.requireActual('./utils').logout,
}));

jest.mock('../../utils/common', () => ({
  generateRoutesList: jest.fn(() => []),
  ITLess: jest.fn(() => false),
  deleteLocalStorageItems: jest.fn(),
}));

jest.mock('../getInitialScope', () => ({
  __esModule: true,
  default: jest.fn(() => undefined),
}));

// Avoid rendering complex placeholders that pull in web components (rh-footer)
jest.mock('../../components/AppPlaceholder', () => ({
  __esModule: true,
  default: () => <div data-testid="app-placeholder" />,
}));

jest.mock('../initializeAccessRequestCookies', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('./useManageSilentRenew', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('OIDCSecured', () => {
  let mockUser: User;
  let mockAuth: AuthContextProps;

  beforeEach(() => {
    resetPermissionCache();
    permissionRequest.mockReset().mockResolvedValue({ data: { data: [], meta: { count: 0 } } });
    entitlementRequest.mockReset().mockResolvedValue({ data: {} });
    mockUser = {
      access_token: 'token-123',
      expires_at: 1700000000,
      toStorageString: () => 'serialized-user',
      session_state: 'session-abc',
      token_type: 'bearer',
      profile: {
        user_id: 'user-123',
      },
      state: undefined,
      id_token: undefined,
      refresh_token: undefined,
      expired: false,
      scope: undefined,
    } as unknown as User;

    mockAuth = {
      user: mockUser,
      isAuthenticated: false,
      error: undefined,
      isLoading: false,
      activeNavigator: undefined,
      signinSilent: jest.fn(),
      signoutRedirect: jest.fn().mockResolvedValue(undefined),
      revokeTokens: jest.fn().mockResolvedValue(undefined),
      // @ts-expect-error: Partial stub for UserManagerEvents, only test needs
      events: { addSilentRenewError: jest.fn(), removeSilentRenewError: jest.fn() },
      // @ts-expect-error: Partial stub for UserManagerSettings, only fields required for test
      settings: { client_id: 'client', metadata: {} },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('sets token cookie and localStorage auth user', async () => {
    const { setCookie } = jest.requireMock('../setCookie');

    const { useAuth } = jest.requireMock('react-oidc-context');
    useAuth.mockReturnValue(mockAuth);

    render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div>child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(setCookie).toHaveBeenCalledWith(mockUser.access_token, mockUser.expires_at);
      expect(localStorage.getItem(RH_USER_ID_STORAGE_KEY)).toBe(mockUser.profile.user_id);
    });
  });

  it('renders placeholder instead of throwing when auth.error is set', async () => {
    const { useAuth } = jest.requireMock('react-oidc-context');
    const signinSilent = jest.fn().mockResolvedValue(undefined);
    mockAuth.error = new Error('Silent renew failed');
    mockAuth.signinSilent = signinSilent;
    useAuth.mockReturnValue(mockAuth);

    const { getByTestId } = render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div data-testid="child">child</div>
      </OIDCSecured>
    );

    // Should show placeholder, not throw
    expect(getByTestId('app-placeholder')).toBeInTheDocument();

    // Should attempt silent recovery
    await waitFor(() => {
      expect(signinSilent).toHaveBeenCalled();
    });
  });

  it('redirects to SSO when silent recovery fails', async () => {
    const { useAuth } = jest.requireMock('react-oidc-context');
    const { login: mockLogin } = jest.requireMock('./utils');
    const signinSilent = jest.fn().mockRejectedValue(new Error('SSO session expired'));
    mockAuth.error = new Error('Silent renew failed');
    mockAuth.signinSilent = signinSilent;
    useAuth.mockReturnValue(mockAuth);

    render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div>child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(signinSilent).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining({ error: mockAuth.error }));
    });
  });

  it('handles if auth.user object is not yet defined', async () => {
    const { setCookie } = jest.requireMock('../setCookie');

    const { useAuth } = jest.requireMock('react-oidc-context');
    mockAuth.user = undefined;
    useAuth.mockReturnValue(mockAuth);

    render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div>child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      // setCookie handles if the token is an empty string and will not attempt to set it in the browser
      expect(setCookie).toHaveBeenCalledWith('', 0);
      expect(localStorage.getItem(RH_USER_ID_STORAGE_KEY)).toBe(null);
    });
  });

  describe('permission cache lifecycle', () => {
    let chromeAuth: ChromeAuthContextValue;
    const CaptureAuth = () => {
      chromeAuth = useContext(ChromeAuthContext);
      return null;
    };
    const tree = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <CaptureAuth />
      </OIDCSecured>
    );
    const authenticate = async (profile: Partial<User['profile']> = {}) => {
      const previous = chromeAuth;
      mockUser.profile = { ...mockUser.profile, org_id: 'org-a', account_id: 'user-a', username: 'username-a', type: 'User', ...profile };
      mockAuth.isAuthenticated = true;
      jest.requireMock('react-oidc-context').useAuth.mockImplementation(() => mockAuth);
      const rendered = render(tree());
      await waitFor(() => expect(chromeAuth).not.toBe(previous));
      await waitFor(() => expect(chromeAuth.ready).toBe(true));
      return rendered;
    };

    it('retries a negative cached read after silent renewal using the original getter', async () => {
      const rendered = await authenticate();
      const getUser = chromeAuth.getUser;
      const read = createFetchPermissionsWatcher(getUser);
      permissionRequest.mockRejectedValueOnce(new AxiosError('offline', 'ERR_NETWORK'));
      await read('old-token');
      await read('old-token');
      expect(permissionRequest).toHaveBeenCalledTimes(1);
      mockAuth = { ...mockAuth, user: { ...mockUser, access_token: 'renewed-token' } as User };
      rendered.rerender(tree());
      await waitFor(() => expect(chromeAuth.token).toBe('renewed-token'));
      expect(chromeAuth.getUser).toBe(getUser);
      await read('renewed-token');
      expect(permissionRequest).toHaveBeenCalledTimes(2);
    });

    it('keeps the captured user getter current and drops positive cache on an identity change', async () => {
      const rendered = await authenticate();
      const getUser = chromeAuth.getUser;
      const read = createFetchPermissionsWatcher(getUser);
      await read('token');
      mockAuth = { ...mockAuth, user: { ...mockUser, profile: { ...mockUser.profile, account_id: 'user-b' } } as User };
      rendered.rerender(tree());
      await waitFor(() => expect(chromeAuth.user.identity.internal?.account_id).toBe('user-b'));
      expect(chromeAuth.getUser).toBe(getUser);
      expect((await getUser()).identity.internal?.account_id).toBe('user-b');
      await read('token');
      expect(permissionRequest).toHaveBeenCalledTimes(2);
    });

    it('retains entitlements and successful permissions during a same-user token renewal', async () => {
      const entitlements = { insights: { is_entitled: true, is_trial: false } };
      entitlementRequest.mockResolvedValueOnce({ data: entitlements });
      const rendered = await authenticate();
      const getUser = chromeAuth.getUser;
      const read = createFetchPermissionsWatcher(getUser);
      await read('token');
      let finish!: (value: { data: typeof entitlements }) => void;
      entitlementRequest.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
      mockAuth = { ...mockAuth, user: { ...mockUser, access_token: 'renewed-token' } as User };
      rendered.rerender(tree());
      expect((await getUser()).entitlements).toEqual(entitlements);
      await read('renewed-token');
      expect(permissionRequest).toHaveBeenCalledTimes(1);
      await act(async () => finish({ data: entitlements }));
      expect(chromeAuth.token).toBe('renewed-token');
    });

    it.each([{ account_id: 'user-a' }, { account_id: undefined }])(
      'delivers pending permissions after same-user token renewal with profile %o',
      async (profile) => {
        const rendered = await authenticate(profile);
        const read = createFetchPermissionsWatcher(chromeAuth.getUser);
        const permissions = [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }];
        let finish!: (value: { data: { data: typeof permissions } }) => void;
        permissionRequest.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
        const first = read('old-token');
        await waitFor(() => expect(permissionRequest).toHaveBeenCalledTimes(1));
        mockAuth = { ...mockAuth, user: { ...mockUser, access_token: 'renewed-token' } as User };
        rendered.rerender(tree());
        await waitFor(() => expect(chromeAuth.token).toBe('renewed-token'));
        expect(permissionRequest.mock.calls[0][0].options.signal.aborted).toBe(false);
        const second = read('renewed-token');
        finish({ data: { data: permissions } });
        await expect(Promise.all([first, second])).resolves.toEqual([permissions, permissions]);
        expect(permissionRequest).toHaveBeenCalledTimes(1);
      }
    );

    it.each([{ org_id: 'org-b' }, { account_id: 'user-b' }, { type: 'System' }, { account_id: undefined }])(
      'cancels pending reads immediately when identity changes by %o',
      async (profile) => {
        const rendered = await authenticate();
        const read = createFetchPermissionsWatcher(chromeAuth.getUser);
        const permissions = [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }];
        let finish!: (value: { data: { data: typeof permissions } }) => void;
        permissionRequest.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
        const first = read('old-token');
        await waitFor(() => expect(permissionRequest).toHaveBeenCalledTimes(1));
        mockAuth = { ...mockAuth, user: { ...mockUser, access_token: 'new-token', profile: { ...mockUser.profile, ...profile } } as User };
        rendered.rerender(tree());
        await waitFor(() => expect(chromeAuth.token).toBe('new-token'));
        expect(permissionRequest.mock.calls[0][0].options.signal.aborted).toBe(true);
        finish({ data: { data: permissions } });
        await expect(first).resolves.toEqual([]);
        await expect(read('new-token')).resolves.toEqual([]);
        expect(permissionRequest).toHaveBeenCalledTimes(2);
      }
    );

    it('cannot restore the captured user after logout when an entitlement response arrives late', async () => {
      const rendered = await authenticate();
      const getUser = chromeAuth.getUser;
      let finish!: (value: { data: object }) => void;
      entitlementRequest.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
      mockAuth = { ...mockAuth, user: { ...mockUser, access_token: 'renewed-token' } as User };
      rendered.rerender(tree());
      chromeAuth.logout();
      await act(async () => finish({ data: {} }));
      expect((await getUser()).identity.org_id).toBeUndefined();
    });

    it.each(['logout', 'all-tabs', 'revoke', 'broadcast'])('clears permission cache on %s', async (mode) => {
      await authenticate();
      const savedUser = await chromeAuth.getUser();
      const read = createFetchPermissionsWatcher(async () => savedUser);
      permissionRequest.mockRejectedValueOnce(new AxiosError('offline', 'ERR_NETWORK'));
      await read('token');
      await read('token');
      expect(permissionRequest).toHaveBeenCalledTimes(1);
      await act(async () => {
        if (mode === 'logout') chromeAuth.logout();
        if (mode === 'all-tabs') chromeAuth.logoutAllTabs();
        if (mode === 'revoke') chromeAuth.logoutAllTabs(false);
        if (mode === 'broadcast') {
          const channel = jest.requireMock('broadcast-channel').channel;
          channel.onmessage({ data: { type: 'logout' } });
        }
      });
      expect((await chromeAuth.getUser()).identity.org_id).toBeUndefined();
      await read('token');
      expect(permissionRequest).toHaveBeenCalledTimes(2);
      if (mode === 'revoke') expect(mockAuth.revokeTokens).toHaveBeenCalled();
      else expect(mockAuth.signoutRedirect).toHaveBeenCalled();
    });

    it('clears cache when authentication is lost without an explicit logout call', async () => {
      const rendered = await authenticate();
      const savedUser = await chromeAuth.getUser();
      const read = createFetchPermissionsWatcher(async () => savedUser);
      permissionRequest.mockRejectedValueOnce(new AxiosError('offline', 'ERR_NETWORK'));
      await read('token');
      mockAuth = { ...mockAuth, isAuthenticated: false, user: undefined };
      rendered.rerender(tree());
      await expect(read('token')).resolves.toEqual([]);
      expect(permissionRequest).toHaveBeenCalledTimes(2);
      expect((await chromeAuth.getUser()).identity.org_id).toBeUndefined();
    });
  });
});
