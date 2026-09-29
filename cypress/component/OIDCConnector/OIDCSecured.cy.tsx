import React, { useContext, useEffect, useState } from 'react';
import { OIDCSecured } from '../../../src/auth/OIDCConnector/OIDCSecured';
import { Provider as JotaiProvider } from 'jotai';
import { AuthContext, AuthContextProps, AuthProviderProps } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../../src/auth/ChromeAuthContext';
import chromeStore from '../../../src/state/chromeStore';
import { degradedStateAtom } from '../../../src/state/atoms/degradedStateAtom';
import { healthyPaid } from '../../../src/auth/entitlementsContract.fixture';
import { ENTITLEMENTS_TIMEOUT_MS } from '../../../src/auth/entitlementsConstants';

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

describe('OIDCSecured entitlements outage', () => {
  const entitledUser: User = {
    access_token: 'foo',
    expired: false,
    expires_in: 100,
    profile: {
      aud: 'foo',
      exp: 100,
      iat: 100,
      iss: 'foo',
      sub: 'foo',
      org_id: '12345',
      account_number: '1111111',
      email: 'user@example.com',
      is_internal: false,
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
    signinSilent: () => Promise.resolve(entitledUser),
    signinPopup: () => Promise.resolve(entitledUser),
    signinResourceOwnerCredentials: () => Promise.resolve(entitledUser),
    signoutRedirect: () => Promise.resolve(),
    signoutPopup: () => Promise.resolve(),
    signoutSilent: () => Promise.resolve(),
    querySessionStatus: () => Promise.resolve(null),
    revokeTokens: () => Promise.resolve(),
    startSilentRenew: () => Promise.resolve(),
    stopSilentRenew: () => Promise.resolve(),
    user: entitledUser,
    events: {
      addSilentRenewError: () => {},
      removeSilentRenewError: () => {},
    } as unknown as AuthContextProps['events'],
  };

  const EntitlementsChild = () => {
    const chromeAuth = useContext(ChromeAuthContext);
    const [json, setJson] = useState('pending');
    useEffect(() => {
      chromeAuth.getUser().then((user) => setJson(JSON.stringify(user.entitlements)));
    }, [chromeAuth]);
    return (
      <div>
        <h1>{CHILD_TEXT}</h1>
        <pre data-testid="entitlements">{json}</pre>
      </div>
    );
  };

  const healthyState = {
    userPersonalization: false,
    entitlements: false,
    configFromCache: false,
    featureFlags: false,
    quickstarts: false,
  };

  beforeEach(() => {
    chromeStore.set(degradedStateAtom, healthyState);
    cy.window().then((win) => {
      win.indexedDB.deleteDatabase('chrome-config-cache');
    });
  });

  const mountShell = () => {
    cy.mount(
      <AuthContext.Provider value={authContextValue}>
        <JotaiProvider store={chromeStore}>
          <OIDCSecured ssoUrl="" microFrontendConfig={{}}>
            <EntitlementsChild />
          </OIDCSecured>
        </JotaiProvider>
      </AuthContext.Provider>
    );
  };

  it('reaches ready state on entitlements 503 with Option B', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} }).as('entitlements');
    mountShell();
    cy.contains(CHILD_TEXT).should('exist');
    cy.get('[data-testid="entitlements"]').should('contain', '"insights":{"is_entitled":true');
    cy.get('[data-testid="entitlements"]').should('contain', '"ansible":{"is_entitled":false');
    cy.wrap(chromeStore).should(() => {
      expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(true);
    });
  });

  it('reaches ready state when the entitlements request is aborted', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', (req) => {
      req.destroy();
    });
    mountShell();
    cy.contains(CHILD_TEXT).should('exist');
    cy.wrap(chromeStore).should(() => {
      expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(true);
    });
  });

  it('reaches ready state when entitlements times out', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { delay: ENTITLEMENTS_TIMEOUT_MS + 2000, statusCode: 200, body: healthyPaid });
    mountShell();
    cy.contains(CHILD_TEXT, { timeout: ENTITLEMENTS_TIMEOUT_MS + 4000 }).should('exist');
    cy.wrap(chromeStore).should(() => {
      expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(true);
    });
  });

  it('uses a successful retry inside the timeout budget', () => {
    let calls = 0;
    cy.intercept('GET', '**/api/entitlements/v1/services**', (req) => {
      calls += 1;
      if (calls === 1) {
        req.reply({ statusCode: 503, body: {} });
        return;
      }
      req.reply({ statusCode: 200, body: healthyPaid });
    });
    mountShell();
    cy.contains(CHILD_TEXT).should('exist');
    cy.get('[data-testid="entitlements"]').should('contain', '"ansible":{"is_entitled":true');
    cy.wrap(chromeStore).should(() => {
      expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(false);
    });
  });

  it('clears degraded state after a successful entitlements response', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
    mountShell();
    cy.contains(CHILD_TEXT).should('exist');
    cy.get('[data-testid="entitlements"]').should('contain', '"ansible":{"is_entitled":true');
    cy.wrap(chromeStore).should(() => {
      expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(false);
    });
  });
});
