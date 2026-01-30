import React, { useContext } from 'react';
import { OIDCSecured } from '../../../src/auth/OIDCConnector/OIDCSecured';
import { Provider as JotaiProvider } from 'jotai';
import { AuthContext, AuthContextProps, AuthProviderProps } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../../src/auth/ChromeAuthContext';

const CHILD_TEXT = 'Auth child component';

const ChildComponent = () => {
  const chromeAuth = useContext(ChromeAuthContext);
  const authContextMethods = Object.keys(chromeAuth).reduce<{
    [key in keyof ChromeAuthContextValue]: (...args: unknown[]) => unknown;
  }>((acc, key) => {
    const typedKey = key as keyof ChromeAuthContextValue;
    if (typeof chromeAuth[typedKey] === 'function') {
      acc[typedKey] = chromeAuth[typedKey] as any;
    }
    return acc;
  }, {} as any);

  return (
    <div>
      <h1>{CHILD_TEXT}</h1>
      {Object.entries(authContextMethods).map(([key, value]) => (
        <button key={key} onClick={() => value()}>
          {key}
        </button>
      ))}
    </div>
  );
};

const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <JotaiProvider>{children}</JotaiProvider>;
};

describe('ODIC Secured', () => {
  const testUser: User = {
    access_token: 'foo',
    expired: false,
    expires_in: 100,
    profile: {
      aud: 'foo',
      exp: 100,
      iat: 100,
      iss: 'foo',
      sub: 'foo',
    },
    scopes: [],
    session_state: 'foo',
    state: 'foo',
    token_type: 'foo',
    toStorageString: () => 'foo',
  };

  const authContextSettings: AuthProviderProps = {
    authority: 'https://foo.bar/auth/realms/redhat-external',
    client_id: 'cloud-services',
    redirect_uri: 'localhost:8080',
    post_logout_redirect_uri: 'http://foo.bar/auth/logout',
    silent_redirect_uri: 'http://foo.bar/auth/silent-refresh',
    response_type: 'code',
    response_mode: 'fragment',
    scope: 'openid profile email',
    automaticSilentRenew: false,
    loadUserInfo: true,
    prompt: 'none',
    metadataUrl: '/realms/redhat-external/protocol/openid-connect/auth',
    metadata: {
      authorization_endpoint: 'http://foo.bar/auth/realms/redhat-external/protocol/openid-connect/auth',
      token_endpoint: 'http://foo.bar/auth/realms/redhat-external/protocol/openid-connect/token',
    },
  };

  const authContextValue: AuthContextProps = {
    clearStaleState: () => Promise.resolve(),
    settings: authContextSettings,
    removeUser: () => Promise.resolve(),
    signinRedirect: () => Promise.resolve(),
    isAuthenticated: true,
    isLoading: false,
    signinSilent: () => Promise.resolve(testUser),
    signinPopup: () => Promise.resolve(testUser),
    signinResourceOwnerCredentials: () => Promise.resolve(testUser),
    signoutRedirect: () => Promise.resolve(),
    signoutPopup: () => Promise.resolve(),
    signoutSilent: () => Promise.resolve(),
    querySessionStatus: () => Promise.resolve(null),
    revokeTokens: () => Promise.resolve(),
    startSilentRenew: () => Promise.resolve(),
    stopSilentRenew: () => Promise.resolve(),
    user: testUser,
    events: {
      addSilentRenewError: () => {},
      removeSilentRenewError: () => {},
    } as unknown as AuthContextProps['events'],
  };
  it('should block rendering children if OIDC auth did not finish', () => {
    cy.mount(
      <AuthContext.Provider value={authContextValue}>
        <Wrapper>
          <OIDCSecured ssoUrl="" microFrontendConfig={{}}>
            <ChildComponent />
          </OIDCSecured>
        </Wrapper>
      </AuthContext.Provider>
    );

    cy.contains(CHILD_TEXT).should('not.exist');
  });

  it('should render children if OIDC auth did finish', () => {
    cy.mount(
      <AuthContext.Provider value={authContextValue}>
        <Wrapper>
          <OIDCSecured ssoUrl="" microFrontendConfig={{}}>
            <ChildComponent />
          </OIDCSecured>
        </Wrapper>
      </AuthContext.Provider>
    );

    cy.contains(CHILD_TEXT).should('exist');
  });

  it('Chrome auth context methods should be initialized and called on click', () => {
    cy.mount(
      <AuthContext.Provider value={authContextValue}>
        <Wrapper>
          <OIDCSecured ssoUrl="" microFrontendConfig={{}}>
            <ChildComponent />
          </OIDCSecured>
        </Wrapper>
      </AuthContext.Provider>
    );
    cy.contains(CHILD_TEXT).should('exist');
    const methodMapping = [
      ['logoutAllTabs', 'signoutRedirect'],
      ['logout', 'signoutRedirect'],
      ['login', 'signinRedirect'],
      ['doOffline', 'signinRedirect'],
    ];

    // setup spy objects
    const spies = methodMapping.reduce((acc, [, oidcName]) => {
      if (!acc.find((mapped) => mapped === oidcName)) {
        acc.push(oidcName);
      }

      return acc;
    }, []);
    spies.forEach((oidcName) => {
      const typedMethod = oidcName as keyof AuthContextProps;
      cy.spy(authContextValue, typedMethod).as(oidcName);
    });

    const calls: { [key: string]: number } = {};

    methodMapping.forEach(([chromeName, oidcName]) => {
      cy.contains(new RegExp(`^${chromeName}$`)).click();
      calls[oidcName] = calls[oidcName] ? calls[oidcName] + 1 : 1;
    });

    spies.forEach((oidcName) => {
      cy.get(`@${oidcName}`).should('have.callCount', calls[oidcName]);
    });
  });
});
