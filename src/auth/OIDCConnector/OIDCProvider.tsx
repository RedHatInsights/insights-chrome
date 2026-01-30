import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SSO_ROUTES, ITLess, loadFedModules } from '../../utils/common';
import { AuthProvider } from 'react-oidc-context';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import platformUrl from '../platformUrl';
import { OIDCSecured } from './OIDCSecured';
import AppPlaceholder from '../../components/AppPlaceholder';
import { postbackUrlSetup } from '../offline';
import OIDCUserManagerErrorBoundary from './OIDCUserManagerErrorBoundary';

const OIDCProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<
    | {
        ssoUrl: string;
        microFrontendConfig: Record<string, any>;
      }
    | undefined
  >(undefined);
  async function setupSSO() {
    const {
      // ignore $schema from the data as it is an spec ref
      data: { $schema: ignore, ...data },
    } = await loadFedModules();
    try {
      const {
        chrome: {
          config: { ssoUrl },
        },
      } = data;
      setState({ ssoUrl: platformUrl(DEFAULT_SSO_ROUTES, ssoUrl), microFrontendConfig: data });
    } catch (error) {
      setState({ ssoUrl: platformUrl(DEFAULT_SSO_ROUTES), microFrontendConfig: data });
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

  if (!state?.ssoUrl || !state?.microFrontendConfig) {
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
