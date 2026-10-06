import React, { useContext, useEffect, useState } from 'react';
import { OIDCSecured } from '../../../src/auth/OIDCConnector/OIDCSecured';
import { Provider as JotaiProvider } from 'jotai';
import { AuthContext, AuthContextProps, AuthProviderProps } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import localforage from 'localforage';
import { IntlProvider } from 'react-intl';
import { BroadcastChannel } from 'broadcast-channel';
import { useFlag } from '@unleash/proxy-client-react';
import ChromeAuthContext, { ChromeAuthContextValue } from '../../../src/auth/ChromeAuthContext';
import chromeStore from '../../../src/state/chromeStore';
import { degradedStateAtom } from '../../../src/state/atoms/degradedStateAtom';
import { DEGRADED_HEADERS, healthyPaid, healthyUnsubscribed } from '../../../src/auth/entitlementsContract.fixture';
import { ENTITLEMENTS_FALLBACK_FLAG, ENTITLEMENTS_TIMEOUT_MS, getEntitlementsCacheKey } from '../../../src/auth/entitlementsConstants';
import FeatureFlagsProvider from '../../../src/components/FeatureFlags/FeatureFlagsProvider';
import DegradedStateBanner from '../../../src/components/DegradedStateBanner/DegradedStateBanner';
import { getFeatureFlagsClient } from '../../../src/components/FeatureFlags/featureFlagsClient';
import { getUnleashClient } from '../../../src/components/FeatureFlags/unleashClient';

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
      <AuthContext.Provider value={{ ...authContextValue, isAuthenticated: false }}>
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
    const fallbackEnabled = useFlag(ENTITLEMENTS_FALLBACK_FLAG);
    const [json, setJson] = useState('pending');
    useEffect(() => {
      chromeAuth.getUser().then((user) => setJson(JSON.stringify(user.entitlements)));
    }, [chromeAuth]);
    return (
      <div>
        <h1>{CHILD_TEXT}</h1>
        <pre data-testid="org-id">{chromeAuth.user?.identity.org_id}</pre>
        <pre data-testid="fallback-flag">{String(fallbackEnabled)}</pre>
        <pre data-testid="entitlements">{json}</pre>
        <button onClick={() => chromeAuth.logout()}>logout</button>
        <button onClick={() => chromeAuth.logoutAllTabs(false)}>logoutAllTabs</button>
      </div>
    );
  };

  const healthyState = {
    userPersonalization: false,
    entitlements: false,
    configFromCache: false,
    featureFlags: false,
  };
  const cache = localforage.createInstance({ name: 'chrome-config-cache', driver: localforage.INDEXEDDB });
  const key = `v1:${getEntitlementsCacheKey(entitledUser.profile.org_id)}`;
  const banner = '[data-ouia-component-id="DegradedStateBanner"]';
  let mountedAuth: AuthContextProps;
  let rerenderShell: (component: React.ReactElement) => void;

  beforeEach(() => {
    chromeStore.set(degradedStateAtom, healthyState);
    cy.then(() => cache.clear());
  });

  const mockFlags = (enabled: boolean | undefined, bannerEnabled = true) => {
    const toggle = (name: string, enabled: boolean) => ({ name, enabled, variant: { name: 'disabled', enabled: false }, impressionData: false });
    cy.intercept('GET', '**/api/featureflags/v0*', {
      statusCode: 200,
      body: {
        toggles: [
          ...(enabled === undefined ? [] : [toggle(ENTITLEMENTS_FALLBACK_FLAG, enabled)]),
          toggle('platform.chrome.degraded-state-banner', bannerEnabled),
        ],
      },
    }).as('featureFlags');
  };
  const renderShell = (auth: AuthContextProps) => (
    <AuthContext.Provider value={auth}>
      <JotaiProvider store={chromeStore}>
        <OIDCSecured ssoUrl="" microFrontendConfig={{}}>
          <FeatureFlagsProvider>
            <IntlProvider locale="en">
              <EntitlementsChild />
              <DegradedStateBanner />
            </IntlProvider>
          </FeatureFlagsProvider>
        </OIDCSecured>
      </JotaiProvider>
    </AuthContext.Provider>
  );
  const mountShell = (enabled = true, interceptFlags = true) => {
    if (interceptFlags) {
      mockFlags(enabled);
    }
    const user = { ...entitledUser, profile: { ...entitledUser.profile, account_id: Cypress.currentTest.title } } as User;
    mountedAuth = { ...authContextValue, user };
    cy.mount(renderShell(mountedAuth)).then(({ rerender }) => {
      rerenderShell = rerender;
    });
  };
  const refreshShell = (orgId = entitledUser.profile.org_id) => {
    cy.then(() => {
      const user = mountedAuth.user!;
      mountedAuth = { ...mountedAuth, user: { ...user, access_token: `${user.access_token}-refresh`, profile: { ...user.profile, org_id: orgId } } as User };
      rerenderShell(renderShell(mountedAuth));
    });
  };
  const remountWithStoredFlags = () => {
    cy.mount(<div />);
    // Discard the bootstrap client so the next mount must read the actual stored toggles.
    cy.then(() => getFeatureFlagsClient(undefined, false));
    mountShell(true, false);
  };
  const assertMap = (map: unknown) => {
    cy.get('[data-testid="entitlements"]').should(($element) => expect(JSON.parse($element.text())).to.deep.equal(map));
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
    cy.get(banner).should('contain.text', 'Entitlements');
    cy.then(() => cache.getItem(key)).should('be.null');
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
    cy.get('[data-testid="entitlements"]').should('contain', '"ansible":{"is_entitled":false');
    // Wait beyond the intercepted response's arrival to check late-write suppression in Chrome.
    cy.wait(2500);
    cy.get('[data-testid="entitlements"]').should('contain', '"ansible":{"is_entitled":false');
    cy.then(() => cache.getItem(key)).should('be.null');
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

  it('uses the original empty-map failure behavior when the flag is off', () => {
    let calls = 0;
    cy.intercept('GET', '**/api/entitlements/v1/services**', (req) => {
      calls += 1;
      req.reply({ statusCode: 503, body: {} });
    });
    mountShell(false);
    cy.get('[data-testid="entitlements"]').should('have.text', '{}');
    cy.wrap(chromeStore).should(() => {
      expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(false);
      expect(calls).to.equal(1);
    });
  });

  it('persists the healthy live map in the organization-scoped IndexedDB envelope', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid }).as('healthyEntitlements');
    mountShell();
    assertMap(healthyPaid);
    cy.wait('@healthyEntitlements');
    cy.then(() => cache.getItem(key))
      .should('have.property', 'data')
      .and('deep.equal', healthyPaid);
    cy.then(() => cache.getItem<{ cachedAt: number }>(key)).then((entry) => {
      expect(entry!.cachedAt).to.be.a('number').and.at.most(Date.now());
      expect(cache.driver()).to.equal(localforage.INDEXEDDB);
    });
    cy.get(banner).should('not.exist');
  });

  it('uses the warm paid cache during an outage and clears the banner on recovery', () => {
    let failing = false;
    cy.intercept('GET', '**/api/entitlements/v1/services**', (req) => {
      req.reply({ statusCode: failing ? 503 : 200, body: failing ? {} : healthyPaid });
    });
    mountShell();
    assertMap(healthyPaid);
    cy.then(() => cache.getItem(key))
      .should('have.property', 'data')
      .and('deep.equal', healthyPaid);
    cy.then(() => {
      failing = true;
    });
    remountWithStoredFlags();
    assertMap(healthyPaid);
    cy.get(banner).should('contain.text', 'Entitlements');
    cy.then(() => {
      failing = false;
    });
    refreshShell();
    assertMap(healthyPaid);
    cy.get(banner).should('not.exist');
  });

  it('does not mark a healthy unsubscribed map as degraded', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyUnsubscribed });
    mountShell();
    assertMap(healthyUnsubscribed);
    cy.get(banner).should('not.exist');
    cy.wrap(chromeStore).should(() => expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(false));
  });

  it('uses a degraded 200 body without replacing a richer paid IndexedDB entry', () => {
    const envelope = { data: healthyPaid, cachedAt: Date.now() };
    cy.then(() => cache.setItem(key, envelope));
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyUnsubscribed, headers: DEGRADED_HEADERS });
    mountShell();
    assertMap(healthyUnsubscribed);
    cy.get(banner).should('contain.text', 'Entitlements');
    cy.then(() => cache.getItem(key)).should('deep.equal', envelope);
  });

  it('ignores other-org and legacy unscoped entries, including after an in-place org switch', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
    mountShell();
    assertMap(healthyPaid);
    cy.then(() => cache.getItem(key))
      .should('have.property', 'data')
      .and('deep.equal', healthyPaid);
    cy.then(() => cache.setItem('v1:entitlements-services', { data: healthyPaid, cachedAt: Date.now() }));
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    refreshShell('org-B');
    cy.get('[data-testid="org-id"]').should('have.text', 'org-B');
    assertMap(healthyUnsubscribed);
    cy.get(banner).should('contain.text', 'Entitlements');
    cy.then(() => cache.getItem(`v1:${getEntitlementsCacheKey('org-B')}`)).should('be.null');
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyUnsubscribed });
    refreshShell('org-B');
    cy.get(banner).should('not.exist');
  });

  it("uses only org B's own warm cache after an org switch", () => {
    cy.then(() => cache.setItem(`v1:${getEntitlementsCacheKey('org-B')}`, { data: healthyUnsubscribed, cachedAt: Date.now() }));
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
    mountShell();
    assertMap(healthyPaid);
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    refreshShell('org-B');
    cy.get('[data-testid="org-id"]').should('have.text', 'org-B');
    assertMap(healthyUnsubscribed);
  });

  it("uses org B's disabled rollout in both auth bootstrap and React flag hooks", () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
    mountShell();
    assertMap(healthyPaid);
    cy.get('[data-testid="fallback-flag"]').should('have.text', 'true');
    mockFlags(false);
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    refreshShell('org-B');
    cy.get('[data-testid="org-id"]').should('have.text', 'org-B');
    assertMap({});
    cy.get('[data-testid="fallback-flag"]').should('have.text', 'false');
  });

  for (const method of ['logout', 'logoutAllTabs']) {
    it(`clears only the entitlement key on ${method} and calls the OIDC logout method`, () => {
      const configEnvelope = { data: { test: true }, cachedAt: Date.now() };
      cy.then(() => cache.setItem('v1:sso-config', configEnvelope));
      cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
      mountShell();
      assertMap(healthyPaid);
      cy.then(() => cache.getItem(key))
        .should('have.property', 'data')
        .and('deep.equal', healthyPaid);
      cy.then(() => cy.spy(mountedAuth, method === 'logout' ? 'signoutRedirect' : 'revokeTokens').as('oidcLogout'));
      cy.contains('button', new RegExp(`^${method}$`)).click();
      cy.get('@oidcLogout').should('have.been.calledOnce');
      cy.then(() => cache.getItem(key)).should('be.null');
      cy.then(() => cache.getItem('v1:sso-config')).should('deep.equal', configEnvelope);
    });
  }

  it('receives the legacy nested logout envelope over the same real broadcast transport', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
    mountShell();
    assertMap(healthyPaid);
    cy.then(() => cy.spy(mountedAuth, 'signoutRedirect').as('nestedLogout'));
    cy.then(async () => {
      const remote = new BroadcastChannel('auth');
      await remote.postMessage({ data: { type: 'logout' } });
      await remote.close();
    });
    cy.get('@nestedLogout').should('have.been.calledOnce');
    cy.then(() => cache.getItem(key)).should('be.null');
  });

  it('retains the warm entitlement key on legacy logout', () => {
    const envelope = { data: healthyPaid, cachedAt: Date.now() };
    cy.then(() => cache.setItem(key, envelope));
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    mountShell(false);
    assertMap({});
    cy.then(() => cy.spy(mountedAuth, 'signoutRedirect').as('legacyLogout'));
    cy.contains('button', /^logout$/).click();
    cy.get('@legacyLogout').should('have.been.calledOnce');
    cy.then(() => cache.getItem(key)).should('deep.equal', envelope);
  });

  it('uses identity-scoped stored enabled toggles when the flag endpoint is unavailable', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
    mountShell();
    assertMap(healthyPaid);
    cy.then(() => {
      const stored = localStorage.getItem(`unleash:repository:${entitledUser.profile.org_id}:${Cypress.currentTest.title}:repo`);
      expect(JSON.parse(stored!)).to.deep.include({
        name: ENTITLEMENTS_FALLBACK_FLAG,
        enabled: true,
        variant: { name: 'disabled', enabled: false },
        impressionData: false,
      });
    });
    cy.intercept('GET', '**/api/featureflags/v0*', { statusCode: 503, body: {} });
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    remountWithStoredFlags();
    assertMap(healthyPaid);
    cy.get(banner).should('contain.text', 'Entitlements');
  });

  it('defaults a fresh identity off when the flag endpoint fails, ignoring warm entitlements', () => {
    cy.then(() => cache.setItem(key, { data: healthyPaid, cachedAt: Date.now() }));
    cy.intercept('GET', '**/api/featureflags/v0*', { statusCode: 503, body: {} });
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    mountShell(true, false);
    assertMap({});
    cy.wrap(chromeStore).should(() => expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(false));
  });

  it('defaults an absent toggle off with a healthy feature-flag response', () => {
    mockFlags(undefined);
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    mountShell(true, false);
    assertMap({});
  });

  it('bounds stalled flags and entitlements as separate five-second phases with a stored enabled toggle', () => {
    const toggles = [ENTITLEMENTS_FALLBACK_FLAG, 'platform.chrome.degraded-state-banner'].map((name) => ({
      name,
      enabled: true,
      variant: { name: 'disabled', enabled: false },
      impressionData: false,
    }));
    cy.then(() => localStorage.setItem(`unleash:repository:${entitledUser.profile.org_id}:${Cypress.currentTest.title}:repo`, JSON.stringify(toggles)));
    let flagStarted = 0;
    let entitlementsStarted = 0;
    cy.intercept('GET', '**/api/featureflags/v0*', (req) => {
      flagStarted = Date.now();
      req.reply({ delay: ENTITLEMENTS_TIMEOUT_MS + 2000, statusCode: 200, body: { toggles } });
    });
    cy.intercept('GET', '**/api/entitlements/v1/services**', (req) => {
      entitlementsStarted = Date.now();
      req.reply({ delay: ENTITLEMENTS_TIMEOUT_MS + 2000, statusCode: 200, body: healthyPaid });
    });
    mountShell(true, false);
    cy.contains(CHILD_TEXT, { timeout: 2 * ENTITLEMENTS_TIMEOUT_MS + 3000 }).should('exist');
    assertMap(healthyUnsubscribed);
    cy.then(() => {
      expect(entitlementsStarted - flagStarted, 'flag lookup phase (ms)').to.be.within(4500, 6500);
      expect(Date.now() - entitlementsStarted, 'entitlement deadline phase (ms)').to.be.within(4500, 6500);
    });
    cy.get(banner).should('contain.text', 'Entitlements');
    cy.then(() => cache.getItem(key)).should('be.null');
  });

  it('rolls back to legacy behavior after a successful off-toggle refresh with warm cache retained', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 200, body: healthyPaid });
    mountShell();
    assertMap(healthyPaid);
    cy.then(() => cache.getItem(key))
      .should('have.property', 'data')
      .and('deep.equal', healthyPaid);
    mockFlags(false);
    cy.then(() => getUnleashClient().updateToggles());
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    refreshShell();
    assertMap({});
    cy.get(banner).should('not.exist');
    cy.then(() => cache.getItem(key))
      .should('have.property', 'data')
      .and('deep.equal', healthyPaid);
  });

  it('keeps fallback active while the independent degraded-banner toggle is disabled', () => {
    mockFlags(true, false);
    cy.intercept('GET', '**/api/entitlements/v1/services**', { statusCode: 503, body: {} });
    mountShell(true, false);
    assertMap(healthyUnsubscribed);
    cy.get(banner).should('not.exist');
    cy.wrap(chromeStore).should(() => expect(chromeStore.get(degradedStateAtom).entitlements).to.equal(true));
  });

  it('returns a healthy legacy map in one request without an IndexedDB write', () => {
    let calls = 0;
    cy.intercept('GET', '**/api/entitlements/v1/services**', (req) => {
      calls += 1;
      req.reply({ statusCode: 200, body: healthyPaid, headers: { 'cache-control': 'no-store' } });
    });
    mountShell(false);
    assertMap(healthyPaid);
    cy.then(() => expect(calls).to.equal(1));
    cy.then(() => cache.getItem(key)).should('be.null');
    cy.get(banner).should('not.exist');
  });

  it('uses the degraded live body without cache writes or reporting when disabled', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', {
      statusCode: 200,
      body: healthyUnsubscribed,
      headers: { ...DEGRADED_HEADERS, 'cache-control': 'no-store' },
    });
    mountShell(false);
    assertMap(healthyUnsubscribed);
    cy.get(banner).should('not.exist');
    cy.then(() => cache.getItem(key)).should('be.null');
  });

  it('does not apply the enabled timeout to a delayed legacy request', () => {
    cy.intercept('GET', '**/api/entitlements/v1/services**', { delay: ENTITLEMENTS_TIMEOUT_MS + 2000, statusCode: 200, body: healthyPaid }).as(
      'legacyEntitlements'
    );
    mountShell(false);
    cy.wait('@featureFlags');
    cy.wait(ENTITLEMENTS_TIMEOUT_MS + 500);
    cy.contains(CHILD_TEXT).should('not.exist');
    cy.wait('@legacyEntitlements');
    cy.get('[data-testid="entitlements"]').should('contain', '"ansible":{"is_entitled":true');
  });
});
