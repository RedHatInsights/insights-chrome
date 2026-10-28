import React, { useEffect, useMemo, useState } from 'react';
import { ITLess, loadFedModules, loadSSOConfig, resolveSSOUrl } from '../../utils/common';
import { AuthProvider } from 'react-oidc-context';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { OIDCSecured } from './OIDCSecured';
import AppPlaceholder from '../../components/AppPlaceholder';
import { postbackUrlSetup } from '../offline';
import OIDCUserManagerErrorBoundary from './OIDCUserManagerErrorBoundary';
import { ACCOUNT_RETURN_PARAM, INTL_DEBUG_KEY } from '../../utils/languageResolution';

const OIDCProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<
    | {
        ssoUrl: string;
        microFrontendConfig: Record<string, any>;
      }
    | undefined
  >(undefined);
  async function setupSSO() {
    // Load SSO configuration from operator-generated config
    const ssoConfig = await loadSSOConfig();
    const ssoUrl = resolveSSOUrl(ssoConfig);

    try {
      const {
        // ignore $schema from the data as it is an spec ref
        data: { $schema: _ignore, ...data },
      } = await loadFedModules();

      setState({
        ssoUrl,
        microFrontendConfig: data,
      });
    } catch (error) {
      console.error('Failed to load fed-modules configuration:', error);
      // State stays undefined, AppPlaceholder will be shown
    }
  }
  useEffect(() => {
    // required for offline token generation
    postbackUrlSetup();
    setupSSO();
  }, []);

  const userManager: UserManager = useMemo(
    () =>
      new UserManager({
        client_id: ITLess() ? 'console-dot' : 'cloud-services',
        silent_redirect_uri: `https://${window.location.host}/apps/chrome/js/silent-check-sso.html`,
        automaticSilentRenew: true,
        redirect_uri: `${window.location.origin}`,
        authority: `${state?.ssoUrl}`,
        metadataUrl: '/realms/redhat-external/protocol/openid-connect/auth',
        monitorSession: true,
        metadata: {
          authorization_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/auth`,
          token_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/token`,
          end_session_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/logout`,
          check_session_iframe: `https://${window.location.host}/apps/chrome/js/silent-check-sso.html`,
          revocation_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/revoke`,
        },
        // removes code_challenge query param from the url
        disablePKCE: true,
        response_type: 'code',
        response_mode: 'fragment',
        userStore: new WebStorageStateStore({ store: window.localStorage }),
      }),
    [state?.ssoUrl]
  );

  /**
   * Return trip from the SSO account console. SSO is a separate application,
   * so its back link is a full page load on our origin, not a SPA navigation:
   * silently re-auth before the app renders, so the fresh token claims —
   * including an updated locale — are in place and nothing boots on stale
   * identity. The parameter is only ever set by our own account-console
   * links, so this runs unconditionally; a failure or timeout falls through
   * to a normal boot with the stored identity.
   */
  // Initialized from the marker so the auth tree is gated on the very first
  // render: without this, AuthProvider and OIDCSecured mount for one render
  // on the stale identity before the effect below closes the gate.
  const [accountReturnRefresh, setAccountReturnRefresh] = useState(() => new URLSearchParams(window.location.search).get(ACCOUNT_RETURN_PARAM) === '1');
  useEffect(() => {
    // The UserManager memo runs before the SSO config resolves, creating a
    // placeholder whose endpoints are unusable ("undefinedrealms/…" — not a
    // valid URL). Wait for the real configuration; the return parameter
    // stays in the URL until then, so this effect consumes it exactly once,
    // with a working manager.
    if (!state?.ssoUrl) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get(ACCOUNT_RETURN_PARAM) !== '1') {
      return;
    }
    params.delete(ACCOUNT_RETURN_PARAM);
    const cleaned = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', cleaned);

    setAccountReturnRefresh(true);
    const fallback = window.setTimeout(() => setAccountReturnRefresh(false), 5000);
    const debug = localStorage.getItem(INTL_DEBUG_KEY) === 'true';
    if (debug) {
      console.log('[chrome:language] SSO return trip: forcing silent re-auth');
    }
    userManager
      .signinSilent()
      .then((user) => {
        if (debug) {
          console.log('[chrome:language] SSO return trip: silent re-auth resolved; id_token locale claim:', user?.profile.locale ?? 'none');
        }
      })
      .catch((error) => {
        if (debug) {
          console.log('[chrome:language] SSO return trip: silent re-auth FAILED:', error);
        }
      })
      .finally(() => {
        window.clearTimeout(fallback);
        setAccountReturnRefresh(false);
      });
  }, [userManager, state?.ssoUrl]);

  if (!state?.ssoUrl || !state?.microFrontendConfig || accountReturnRefresh) {
    return <AppPlaceholder />;
  }

  return (
    <OIDCUserManagerErrorBoundary userManager={userManager}>
      <AuthProvider
        userManager={userManager}
        onSigninCallback={() => {
          const startUrl = new URL(window.location.href);
          // remove the SSO code params from the URL
          startUrl.hash = '';
          window.history.replaceState({}, document.title, startUrl);
        }}
      >
        <OIDCSecured ssoUrl={state.ssoUrl} microFrontendConfig={state.microFrontendConfig}>
          {children}
        </OIDCSecured>
      </AuthProvider>
    </OIDCUserManagerErrorBoundary>
  );
};

export default OIDCProvider;
