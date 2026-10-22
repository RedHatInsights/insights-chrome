import React, { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { OIDCSecured } from './OIDCSecured';
import { RH_USER_ID_STORAGE_KEY } from '../../utils/consts';
import { AuthContextProps } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import { fetchEntitlements } from '../fetchEntitlements';
import chromeStore from '../../state/chromeStore';
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';
import { healthyPaid, healthyUnsubscribed } from '../entitlementsContract.fixture';
import ChromeAuthContext from '../ChromeAuthContext';
import { getBootstrapFeatureFlag } from '../../components/FeatureFlags/featureFlagsClient';
import { getMinimumViableEntitlements } from '../getMinimumViableEntitlements';
import sentry from '../../utils/sentry';
import { loadChromeUserConfigOnce } from '../../utils/initUserConfig';
import { hydratePreviewAtom, isPreviewAtom } from '../../state/atoms/releaseAtom';
import * as Sentry from '@sentry/react';
import { ChromeUser } from '@redhat-cloud-services/types';

const EntitlementsProbe = () => {
  const auth = useContext(ChromeAuthContext);
  return <pre data-testid="entitlements">{JSON.stringify(auth.user?.entitlements)}</pre>;
};

jest.mock('../../components/FeatureFlags/featureFlagsClient', () => ({ getBootstrapFeatureFlag: jest.fn().mockResolvedValue(true) }));
jest.mock('../../utils/VisibilitySingleton', () => ({ visibilityFunctionsExist: () => false }));
jest.mock('../../utils/initUserConfig', () => ({ loadChromeUserConfigOnce: jest.fn() }));
jest.mock('@sentry/react', () => ({ captureMessage: jest.fn() }));

jest.mock('../fetchEntitlements', () => ({
  fetchEntitlements: jest.fn().mockResolvedValue({ entitlements: {}, degraded: false, source: 'empty' }),
  getMinimumViableEntitlements: jest.requireActual('../getMinimumViableEntitlements').getMinimumViableEntitlements,
}));

jest.mock('../../utils/iqeEnablement', () => ({
  init: jest.fn(),
}));

jest.mock('../../utils/sentry', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock setCookie to observe calls from the effect under test
jest.mock('../setCookie', () => ({
  setCookie: jest.fn(),
}));

// Minimal mocks to avoid unrelated side-effects during render
jest.mock('broadcast-channel', () => ({
  BroadcastChannel: jest.fn().mockImplementation(() => ({ postMessage: jest.fn(), close: jest.fn() })),
}));

jest.mock('react-oidc-context', () => ({
  hasAuthParams: jest.fn(() => false),
  useAuth: jest.fn(),
}));

jest.mock('./utils', () => ({
  login: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('../../utils/common', () => ({
  generateRoutesList: jest.fn(() => []),
  ITLess: jest.fn(() => false),
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
  const mockedFetchEntitlements = jest.mocked(fetchEntitlements);

  beforeEach(() => {
    jest.mocked(getBootstrapFeatureFlag).mockResolvedValue(true);
    jest.mocked(loadChromeUserConfigOnce).mockResolvedValue({ data: { uiPreview: false, uiPreviewSeen: false } });
    chromeStore.set(hydratePreviewAtom, false);
    mockedFetchEntitlements.mockReset();
    mockedFetchEntitlements.mockResolvedValue({ entitlements: {}, degraded: false, source: 'empty' });
    chromeStore.set(degradedStateAtom, {
      userPersonalization: false,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
      quickstarts: false,
    });
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

  it('reaches ready state when entitlements return 503', async () => {
    const { useAuth } = jest.requireMock('react-oidc-context');
    mockedFetchEntitlements.mockResolvedValue({ entitlements: healthyPaid, degraded: true, source: 'defaults' });
    mockUser.profile = { ...mockUser.profile, org_id: '12345' };
    mockAuth.isAuthenticated = true;
    useAuth.mockReturnValue(mockAuth);

    const { getByTestId, queryByTestId } = render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div data-testid="child">child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeInTheDocument();
    });
    expect(queryByTestId('app-placeholder')).not.toBeInTheDocument();
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true);
  });

  it('reaches ready state when entitlements time out', async () => {
    const { useAuth } = jest.requireMock('react-oidc-context');
    mockedFetchEntitlements.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ entitlements: healthyPaid, degraded: true, source: 'defaults' }), 10);
        })
    );
    mockUser.profile = { ...mockUser.profile, org_id: '12345' };
    mockAuth.isAuthenticated = true;
    useAuth.mockReturnValue(mockAuth);

    const { getByTestId } = render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div data-testid="child">child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeInTheDocument();
    });
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true);
  });

  it('clears entitlements degradation after a successful recovery fetch', async () => {
    const { useAuth } = jest.requireMock('react-oidc-context');
    mockedFetchEntitlements
      .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: true, source: 'cache' })
      .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: false, source: 'live' });
    mockUser.profile = { ...mockUser.profile, org_id: '12345' };
    mockAuth.isAuthenticated = true;
    useAuth.mockReturnValue(mockAuth);

    const { getByTestId, rerender } = render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div data-testid="child">child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeInTheDocument();
    });
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true);

    mockUser = { ...mockUser, access_token: 'token-456' } as User;
    mockAuth.user = mockUser;
    useAuth.mockReturnValue(mockAuth);
    rerender(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div data-testid="child">child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(chromeStore.get(degradedStateAtom).entitlements).toBe(false);
    });
  });

  it('keeps the previous entitlements map when a later fetch is degraded', async () => {
    const { useAuth } = jest.requireMock('react-oidc-context');
    mockedFetchEntitlements.mockImplementation(async (_user, options) => {
      if (options?.previous && Object.keys(options.previous).length > 0) {
        return { entitlements: options.previous, degraded: true, source: 'memory' };
      }
      return { entitlements: healthyPaid, degraded: false, source: 'live' };
    });
    mockUser.profile = { ...mockUser.profile, org_id: '12345' };
    mockAuth.isAuthenticated = true;
    useAuth.mockReturnValue(mockAuth);

    const { getByTestId, rerender } = render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div data-testid="child">child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeInTheDocument();
    });

    mockUser = { ...mockUser, access_token: 'token-789' } as User;
    mockAuth.user = mockUser;
    useAuth.mockReturnValue(mockAuth);
    rerender(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
        <div data-testid="child">child</div>
      </OIDCSecured>
    );

    await waitFor(() => {
      expect(mockedFetchEntitlements).toHaveBeenCalledTimes(2);
      expect(mockedFetchEntitlements.mock.calls[1][1]?.previous).toEqual(healthyPaid);
    });
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true);
  });

  it('does not pass enhanced options or report degradation when the flag is off', async () => {
    jest.mocked(getBootstrapFeatureFlag).mockResolvedValue(false);
    mockedFetchEntitlements.mockResolvedValue({ entitlements: {}, degraded: false, source: 'empty' });
    mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
    mockAuth.isAuthenticated = true;
    jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    const { getByTestId } = render(
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
      </OIDCSecured>
    );
    await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('{}'));
    expect(mockedFetchEntitlements).toHaveBeenCalledWith(mockUser);
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(false);
  });

  it('clears previous entitlements when org changes without unmounting', async () => {
    mockedFetchEntitlements.mockImplementation(async (user, options) => ({
      entitlements: user.profile?.org_id === 'org-a' ? healthyPaid : (options?.previous ?? getMinimumViableEntitlements(user)),
      degraded: user.profile?.org_id !== 'org-a',
      source: 'live',
    }));
    mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
    mockAuth.isAuthenticated = true;
    jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
      </OIDCSecured>
    );
    const { getByTestId, rerender } = render(shell());
    await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":true'));
    mockAuth.user = { ...mockUser, profile: { ...mockUser.profile, org_id: 'org-b' } } as User;
    rerender(shell());
    await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":false'));
    expect(mockedFetchEntitlements.mock.calls[1][1]?.previous).toBeUndefined();
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true);
  });

  it('ignores a late result from the prior organization', async () => {
    let resolve!: (result: Awaited<ReturnType<typeof fetchEntitlements>>) => void;
    mockedFetchEntitlements
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          })
      )
      .mockResolvedValueOnce({ entitlements: healthyUnsubscribed, degraded: false, source: 'live' });
    mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
    mockAuth.isAuthenticated = true;
    jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
      </OIDCSecured>
    );
    const { getByTestId, rerender } = render(shell());
    await waitFor(() => expect(mockedFetchEntitlements).toHaveBeenCalledTimes(1));
    mockAuth.user = { ...mockUser, profile: { ...mockUser.profile, org_id: 'org-b' } } as User;
    rerender(shell());
    await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":false'));
    await act(async () => resolve({ entitlements: healthyPaid, degraded: true, source: 'live' }));
    await waitFor(() => expect(chromeStore.get(degradedStateAtom).entitlements).toBe(false));
    expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":false');
  });

  it('ignores a disabled bootstrap flag from the prior organization', async () => {
    let resolveFlag!: (enabled: boolean) => void;
    jest
      .mocked(getBootstrapFeatureFlag)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFlag = resolve;
          })
      )
      .mockResolvedValueOnce(true);
    mockedFetchEntitlements.mockResolvedValue({ entitlements: healthyUnsubscribed, degraded: true, source: 'cache' });
    mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
    mockAuth.isAuthenticated = true;
    jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
      </OIDCSecured>
    );
    const { getByTestId, rerender } = render(shell());
    await waitFor(() => expect(getBootstrapFeatureFlag).toHaveBeenCalledTimes(1));
    mockAuth.user = { ...mockUser, profile: { ...mockUser.profile, org_id: 'org-b' } } as User;
    rerender(shell());
    await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":false'));
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true);

    await act(async () => resolveFlag(false));

    expect(mockedFetchEntitlements).toHaveBeenCalledTimes(1);
    expect(mockedFetchEntitlements).toHaveBeenCalledWith(mockAuth.user, { enabled: true, previous: undefined, signal: expect.any(AbortSignal) });
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true);
    expect(sentry).toHaveBeenCalledTimes(1);
    expect(sentry).toHaveBeenCalledWith(expect.objectContaining({ identity: expect.objectContaining({ org_id: 'org-b' }) }));
  });

  it.each([false, true])('ignores a late legacy entitlement result after switching to an organization with fallback=%s', async (enabled) => {
    let resolveEntitlements!: (result: Awaited<ReturnType<typeof fetchEntitlements>>) => void;
    jest.mocked(getBootstrapFeatureFlag).mockResolvedValueOnce(false).mockResolvedValueOnce(enabled);
    mockedFetchEntitlements
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveEntitlements = resolve;
          })
      )
      .mockResolvedValueOnce({ entitlements: healthyUnsubscribed, degraded: enabled, source: enabled ? 'cache' : 'live' });
    mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
    mockAuth.isAuthenticated = true;
    jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
      </OIDCSecured>
    );
    const { getByTestId, rerender } = render(shell());
    await waitFor(() => expect(mockedFetchEntitlements).toHaveBeenCalledWith(mockUser));
    mockAuth.user = { ...mockUser, profile: { ...mockUser.profile, org_id: 'org-b' } } as User;
    rerender(shell());
    await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":false'));

    await act(async () => resolveEntitlements({ entitlements: healthyPaid, degraded: false, source: 'live' }));

    expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":false');
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(enabled);
    expect(sentry).toHaveBeenCalledTimes(1);
    expect(sentry).toHaveBeenCalledWith(expect.objectContaining({ identity: expect.objectContaining({ org_id: 'org-b' }) }));
  });

  it('restores the legacy path and clears enhanced degradation after the flag is disabled', async () => {
    jest.mocked(getBootstrapFeatureFlag).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    mockedFetchEntitlements
      .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: true, source: 'cache' })
      .mockResolvedValueOnce({ entitlements: {}, degraded: false, source: 'empty' });
    mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
    mockAuth.isAuthenticated = true;
    jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
      </OIDCSecured>
    );
    const { getByTestId, rerender } = render(shell());
    await waitFor(() => expect(chromeStore.get(degradedStateAtom).entitlements).toBe(true));
    mockAuth.user = { ...mockUser, access_token: 'renewed' } as User;
    rerender(shell());
    await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('{}'));
    expect(mockedFetchEntitlements.mock.calls[1]).toEqual([mockAuth.user]);
    expect(chromeStore.get(degradedStateAtom).entitlements).toBe(false);
  });
  describe('obsolete entitlement requests', () => {
    const LogoutProbe = () => {
      const auth = useContext(ChromeAuthContext);
      return (
        <>
          <button onClick={() => auth.logout()}>logout</button>
          <button onClick={() => auth.logoutAllTabs(false)}>logoutAllTabs</button>
        </>
      );
    };
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
        <LogoutProbe />
      </OIDCSecured>
    );
    const signalOf = (call: number) => mockedFetchEntitlements.mock.calls[call][1]?.signal as AbortSignal;

    beforeEach(() => {
      mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
      mockAuth.isAuthenticated = true;
      jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    });

    it('aborts the pending request before switching to the next organization', async () => {
      mockedFetchEntitlements
        .mockImplementationOnce(() => new Promise(() => {}))
        .mockResolvedValueOnce({ entitlements: healthyUnsubscribed, degraded: false, source: 'live' });
      const { getByTestId, rerender } = render(shell());
      await waitFor(() => expect(mockedFetchEntitlements).toHaveBeenCalledTimes(1));
      expect(signalOf(0).aborted).toBe(false);

      mockAuth.user = { ...mockUser, access_token: 'org-b-token', profile: { ...mockUser.profile, org_id: 'org-b' } } as User;
      rerender(shell());

      await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":false'));
      expect(signalOf(0).aborted).toBe(true);
      expect(signalOf(1).aborted).toBe(false);
    });

    it('aborts the pending request on unmount', async () => {
      mockedFetchEntitlements.mockImplementationOnce(() => new Promise(() => {}));
      const { unmount } = render(shell());
      await waitFor(() => expect(mockedFetchEntitlements).toHaveBeenCalledTimes(1));
      unmount();
      expect(signalOf(0).aborted).toBe(true);
    });

    it.each(['logout', 'logoutAllTabs'])('aborts the pending re-authentication request on %s', async (method) => {
      mockedFetchEntitlements
        .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: false, source: 'live' })
        .mockImplementationOnce(() => new Promise(() => {}));
      const { getByTestId, getByText, rerender } = render(shell());
      await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":true'));
      mockAuth.user = { ...mockUser, access_token: 'renewed' } as User;
      rerender(shell());
      await waitFor(() => expect(mockedFetchEntitlements).toHaveBeenCalledTimes(2));

      act(() => getByText(method, { selector: 'button' }).click());

      expect(signalOf(1).aborted).toBe(true);
      expect(jest.requireMock('./utils').logout).toHaveBeenCalledTimes(1);
    });

    it('does not pass a signal on the legacy path', async () => {
      jest.mocked(getBootstrapFeatureFlag).mockResolvedValue(false);
      render(shell());
      await waitFor(() => expect(mockedFetchEntitlements).toHaveBeenCalledTimes(1));
      expect(mockedFetchEntitlements.mock.calls[0]).toEqual([mockUser]);
    });
  });

  describe('bootstrap preview context', () => {
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <EntitlementsProbe />
      </OIDCSecured>
    );

    beforeEach(() => {
      mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
      mockAuth.isAuthenticated = true;
      jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    });

    it('evaluates the bootstrap rollout with the saved preview preference', async () => {
      jest.mocked(loadChromeUserConfigOnce).mockResolvedValue({ data: { uiPreview: true, uiPreviewSeen: true } });
      const { getByTestId } = render(shell());
      await waitFor(() => expect(getByTestId('entitlements')).toBeInTheDocument());
      expect(getBootstrapFeatureFlag).toHaveBeenCalledWith(expect.anything(), true, 'platform.chrome.entitlements-fallback');
      expect(jest.mocked(loadChromeUserConfigOnce).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(getBootstrapFeatureFlag).mock.invocationCallOrder[0]);
      expect(chromeStore.get(isPreviewAtom)).toBe(true);
    });

    it('sends the user config request with the authenticated identity token', async () => {
      const { init } = jest.requireMock('../../utils/iqeEnablement') as { init: jest.Mock };
      let tokenAtRequest: string | undefined;
      jest.mocked(loadChromeUserConfigOnce).mockImplementation(async () => {
        // The auth interceptor reads authRef at send time.
        tokenAtRequest = init.mock.calls.at(-1)?.[1].current.user?.access_token;
        return { data: { uiPreview: false, uiPreviewSeen: false } };
      });
      // Like the browser: the first render has no user yet, then sign-in completes.
      const { useAuth } = jest.requireMock('react-oidc-context');
      useAuth.mockReturnValue({ ...mockAuth, user: null, isAuthenticated: false });
      const { getByTestId, rerender } = render(shell());
      useAuth.mockReturnValue(mockAuth);
      rerender(shell());
      await waitFor(() => expect(getByTestId('entitlements')).toBeInTheDocument());
      expect(tokenAtRequest).toBe('token-123');
    });

    it('waits for the user config before the rollout lookup', async () => {
      let resolveConfig!: (config: Awaited<ReturnType<typeof loadChromeUserConfigOnce>>) => void;
      jest.mocked(loadChromeUserConfigOnce).mockReturnValue(
        new Promise((resolve) => {
          resolveConfig = resolve;
        })
      );
      const { getByTestId } = render(shell());
      await waitFor(() => expect(loadChromeUserConfigOnce).toHaveBeenCalledTimes(1));
      await act(async () => undefined);
      expect(getBootstrapFeatureFlag).not.toHaveBeenCalled();
      expect(mockedFetchEntitlements).not.toHaveBeenCalled();

      await act(async () => resolveConfig({ data: { uiPreview: true, uiPreviewSeen: true } }));

      await waitFor(() => expect(getByTestId('entitlements')).toBeInTheDocument());
      expect(getBootstrapFeatureFlag).toHaveBeenCalledWith(expect.anything(), true, 'platform.chrome.entitlements-fallback');
    });

    it('evaluates preview off and still reaches ready when the user config fails', async () => {
      jest.mocked(loadChromeUserConfigOnce).mockRejectedValue(Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' }));
      const { getByTestId } = render(shell());
      await waitFor(() => expect(getByTestId('entitlements')).toBeInTheDocument());
      expect(getBootstrapFeatureFlag).toHaveBeenCalledWith(expect.anything(), false, 'platform.chrome.entitlements-fallback');
      expect(chromeStore.get(isPreviewAtom)).toBe(false);
    });

    it('does not overwrite a session preview toggle on a later re-authentication', async () => {
      jest.mocked(loadChromeUserConfigOnce).mockResolvedValue({ data: { uiPreview: true, uiPreviewSeen: true } });
      const { getByTestId, rerender } = render(shell());
      await waitFor(() => expect(getByTestId('entitlements')).toBeInTheDocument());
      expect(chromeStore.get(isPreviewAtom)).toBe(true);

      chromeStore.set(hydratePreviewAtom, false);
      mockAuth.user = { ...mockUser, access_token: 'renewed' } as User;
      rerender(shell());

      await waitFor(() => expect(getBootstrapFeatureFlag).toHaveBeenCalledTimes(2));
      expect(jest.mocked(getBootstrapFeatureFlag).mock.calls[1][1]).toBe(false);
      expect(chromeStore.get(isPreviewAtom)).toBe(false);
    });
  });

  describe('in-session entitlements recovery', () => {
    let firstGetUser: (() => Promise<ChromeUser>) | undefined;
    const CaptureFirstGetUser = () => {
      const auth = useContext(ChromeAuthContext);
      if (auth.ready && !firstGetUser) {
        firstGetUser = auth.getUser;
      }
      return <EntitlementsProbe />;
    };
    const shell = () => (
      <OIDCSecured microFrontendConfig={{}} ssoUrl="">
        <CaptureFirstGetUser />
      </OIDCSecured>
    );
    const renew = (rerender: (ui: React.ReactElement) => void, token: string) => {
      mockAuth.user = { ...mockUser, access_token: token } as User;
      rerender(shell());
    };

    beforeEach(() => {
      firstGetUser = undefined;
      mockUser.profile = { ...mockUser.profile, org_id: 'org-a' };
      mockAuth.isAuthenticated = true;
      jest.requireMock('react-oidc-context').useAuth.mockReturnValue(mockAuth);
    });

    it('serves recovered entitlements through a getUser captured during the outage', async () => {
      const defaults = getMinimumViableEntitlements({ profile: { org_id: 'org-a' } });
      mockedFetchEntitlements
        .mockResolvedValueOnce({ entitlements: defaults, degraded: true, source: 'defaults' })
        .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: false, source: 'live' });
      const { getByTestId, rerender } = render(shell());
      await waitFor(() => expect(firstGetUser).toBeDefined());
      expect((await firstGetUser!()).entitlements).toEqual(defaults);

      // Visibility re-evaluation is triggered by the degraded flag, so the user must already be current then.
      let userAtRecovery: ChromeUser | undefined;
      const unsubscribe = chromeStore.sub(degradedStateAtom, () => {
        if (!chromeStore.get(degradedStateAtom).entitlements) {
          firstGetUser!().then((current) => (userAtRecovery = current));
        }
      });
      renew(rerender, 'renewed');

      await waitFor(() => expect(getByTestId('entitlements')).toHaveTextContent('"ansible":{"is_entitled":true'));
      unsubscribe();
      expect((await firstGetUser!()).entitlements).toEqual(healthyPaid);
      expect(userAtRecovery?.entitlements).toEqual(healthyPaid);
    });

    it('reports a degraded episode to Sentry once, tagged with the fallback source', async () => {
      mockedFetchEntitlements
        .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: true, source: 'cache' })
        .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: true, source: 'memory' })
        .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: false, source: 'live' })
        .mockResolvedValueOnce({ entitlements: healthyPaid, degraded: true, source: 'memory' });
      const { rerender } = render(shell());
      await waitFor(() => expect(Sentry.captureMessage).toHaveBeenCalledTimes(1));
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Entitlements degraded', {
        level: 'warning',
        tags: { area: 'entitlements', source: 'cache' },
      });

      renew(rerender, 'renewed-1');
      await waitFor(() => expect(mockedFetchEntitlements).toHaveBeenCalledTimes(2));
      renew(rerender, 'renewed-2');
      await waitFor(() => expect(chromeStore.get(degradedStateAtom).entitlements).toBe(false));
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);

      renew(rerender, 'renewed-3');
      await waitFor(() => expect(Sentry.captureMessage).toHaveBeenCalledTimes(2));
      expect(jest.mocked(Sentry.captureMessage).mock.calls[1][1]).toMatchObject({ tags: { source: 'memory' } });
    });

    it('reports the catch-path fallback as defaults', async () => {
      mockedFetchEntitlements.mockRejectedValueOnce(new Error('unexpected'));
      render(shell());
      await waitFor(() =>
        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          'Entitlements degraded',
          expect.objectContaining({ tags: { area: 'entitlements', source: 'defaults' } })
        )
      );
    });

    it('does not report to Sentry on the legacy path', async () => {
      jest.mocked(getBootstrapFeatureFlag).mockResolvedValue(false);
      const { getByTestId } = render(shell());
      await waitFor(() => expect(getByTestId('entitlements')).toBeInTheDocument());
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});
