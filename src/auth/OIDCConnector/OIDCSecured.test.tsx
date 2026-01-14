import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { OIDCSecured } from './OIDCSecured';
import { RH_USER_ID_STORAGE_KEY } from '../../utils/consts';
import { AuthContextProps } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { chromeModulesAtom } from '../../state/atoms/chromeModuleAtom';
import ChromeAuthContext from '../ChromeAuthContext';
import { fireEvent, screen } from '@testing-library/react';
import { useFlag } from '@unleash/proxy-client-react';
import shouldReAuthScopes from '../shouldReAuthScopes';

jest.mock('@unleash/proxy-client-react', () => ({ useFlag: jest.fn() }));

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
  isProd: jest.fn(() => false),
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

jest.mock('../shouldReAuthScopes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('OIDCSecured', () => {
  let mockUser: User;
  let mockAuth: AuthContextProps;

  beforeEach(() => {
    (useFlag as jest.Mock).mockReset();
    (useFlag as jest.Mock).mockReturnValue(true);
    (shouldReAuthScopes as jest.Mock).mockReset();
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

  describe('reAuthWithScopes', () => {
    let useAuthMock: any;
    let loginMock: jest.Mock;

    const TestInvoker = () => {
      const ctx = React.useContext(ChromeAuthContext);
      return (
        <button
          onClick={() => {
            void ctx.reAuthWithScopes('extra');
          }}
        >
          invoke
        </button>
      );
    };

    function renderWithAtoms(ui: React.ReactElement, atoms?: { activeModule?: string; modules?: any }) {
      const initialValuesAny: any[] = [];
      if (atoms?.activeModule) {
        initialValuesAny.push([activeModuleAtom, atoms.activeModule] as const);
      }
      if (atoms?.modules) {
        initialValuesAny.push([chromeModulesAtom, atoms.modules] as const);
      }
      const HydrateAtoms = ({ children }: { children: React.ReactNode }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useHydrateAtoms(initialValuesAny as any);
        return <>{children}</>;
      };
      return render(
        <JotaiProvider>
          <HydrateAtoms>{ui}</HydrateAtoms>
        </JotaiProvider>
      );
    }

    beforeEach(() => {
      const { useAuth } = jest.requireMock('react-oidc-context');
      const { login } = jest.requireMock('./utils');
      useAuthMock = useAuth;
      loginMock = login as jest.Mock;
      loginMock.mockReset();

      // default shared setup; tests can override as needed
      mockUser.scope = 'u1 u2';
      mockAuth.user = mockUser;
      mockAuth.isAuthenticated = true;
      (mockAuth.signinSilent as jest.Mock).mockReset();
      useAuthMock.mockReturnValue(mockAuth);
    });

    it('calls signinSilent with merged scopes and does not fallback when user returned', async () => {
      (mockAuth.signinSilent as jest.Mock).mockResolvedValue({} as User);
      (useFlag as jest.Mock).mockReturnValue(true);

      renderWithAtoms(
        <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
          <TestInvoker />
        </OIDCSecured>,
        {
          activeModule: 'foo',
          modules: { foo: { config: { ssoScopes: ['r1', 'r2'] } } },
        }
      );

      const btn = await screen.findByText('invoke');
      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockAuth.signinSilent as jest.Mock).toHaveBeenCalledWith({
          scope: 'r1 r2 extra u1 u2',
          prompt: 'none',
          forceIframeAuth: true,
        });
      });
      expect(loginMock).not.toHaveBeenCalled();
    });

    it('falls back to login when signinSilent resolves null', async () => {
      (mockAuth.signinSilent as jest.Mock).mockResolvedValue(null);

      renderWithAtoms(
        <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
          <TestInvoker />
        </OIDCSecured>,
        {
          activeModule: 'foo',
          modules: { foo: { config: { ssoScopes: ['r1'] } } },
        }
      );

      const btn = await screen.findByText('invoke');
      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockAuth.signinSilent as jest.Mock).toHaveBeenCalled();
      });
      expect(loginMock).toHaveBeenCalledWith(expect.anything(), ['r1', 'extra', 'u1', 'u2']);
    });

    it('falls back to login when signinSilent rejects', async () => {
      mockUser.scope = 'u1';
      (useFlag as jest.Mock).mockReturnValue(true);
      (mockAuth.signinSilent as jest.Mock).mockRejectedValue(new Error('boom'));

      renderWithAtoms(
        <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
          <TestInvoker />
        </OIDCSecured>,
        {
          activeModule: 'foo',
          modules: { foo: { config: { ssoScopes: ['req'] } } },
        }
      );

      const btn = await screen.findByText('invoke');
      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockAuth.signinSilent as jest.Mock).toHaveBeenCalled();
      });
      expect(loginMock).toHaveBeenCalledWith(expect.anything(), ['req', 'extra', 'u1']);
    });

    it('when flag disabled and reauth needed, calls login with scopes and does not call signinSilent', async () => {
      (useFlag as jest.Mock).mockReturnValue(false);
      (shouldReAuthScopes as jest.Mock).mockReturnValue([true, ['req1', 'req2']]);

      renderWithAtoms(
        <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
          <TestInvoker />
        </OIDCSecured>,
        {
          activeModule: 'foo',
          modules: { foo: { config: { ssoScopes: ['r1'] } } },
        }
      );

      const btn = await screen.findByText('invoke');
      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockAuth.signinSilent as jest.Mock).not.toHaveBeenCalled();
      });
      expect(loginMock).toHaveBeenCalledWith(expect.anything(), ['req1', 'req2']);
    });

    it('when flag disabled and reauth not needed, does nothing', async () => {
      (useFlag as jest.Mock).mockReturnValue(false);
      (shouldReAuthScopes as jest.Mock).mockReturnValue([false, []]);

      renderWithAtoms(
        <OIDCSecured microFrontendConfig={{}} ssoUrl="https://sso.stage.redhat.com/auth">
          <TestInvoker />
        </OIDCSecured>,
        {
          activeModule: 'foo',
          modules: { foo: { config: { ssoScopes: [] } } },
        }
      );

      const btn = await screen.findByText('invoke');
      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockAuth.signinSilent as jest.Mock).not.toHaveBeenCalled();
        expect(loginMock).not.toHaveBeenCalled();
      });
    });
  });
});
