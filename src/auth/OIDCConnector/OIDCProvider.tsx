import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SSO_ROUTES, loadFedModules } from '../../utils/common';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import platformUrl from '../platformUrl';
import { OIDCSecured } from './OIDCSecured';
import AppPlaceholder from '../../components/AppPlaceholder';
import { postbackUrlSetup } from '../offline';

const OIDCProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [cookieElement, setCookieElement] = useState<HTMLAnchorElement | null>(null);
  const [state, setState] = useState<
    | {
        ssoUrl: string;
        microFrontendConfig: Record<string, any>;
      }
    | undefined
  >(undefined);
  async function setupSSO() {
    const { data } = await loadFedModules();
    try {
      const {
        chrome: {
          config: { ssoUrl },
        },
      } = data;
      // add trailing slash if missing
      const sanitizedSSOUrl = `${ssoUrl.replace(/\/$/, '')}/`;
      setState({ ssoUrl: platformUrl(DEFAULT_SSO_ROUTES, sanitizedSSOUrl), microFrontendConfig: data });
    } catch (error) {
      setState({ ssoUrl: platformUrl(DEFAULT_SSO_ROUTES), microFrontendConfig: data });
    }
  }
  useEffect(() => {
    // required for offline token generation
    postbackUrlSetup();
    setupSSO();
  }, []);

  const authProviderProps: AuthProviderProps = useMemo(
    () => ({
      client_id: 'cloud-services',
      silent_redirect_uri: `https://${window.location.host}/beta/apps/chrome/silent-check-sso.html`,
      automaticSilentRenew: true,
      redirect_uri: `${window.location.origin}`,
      authority: `${state?.ssoUrl}`,
      metadataUrl: '/realms/redhat-external/protocol/openid-connect/auth',
      monitorSession: true,
      metadata: {
        authorization_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/auth`,
        token_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/token`,
        end_session_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/logout`,
        check_session_iframe: `https://${window.location.host}/beta/apps/chrome/silent-check-sso.html`,
        revocation_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/revoke`,
      },
      // removes code_challenge query param from the url
      disablePKCE: true,
      response_type: 'code',
      response_mode: 'fragment',
      onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
      },
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    }),
    [state?.ssoUrl]
  );

  if (!state?.ssoUrl || !state?.microFrontendConfig) {
    return <AppPlaceholder cookieElement={cookieElement} setCookieElement={setCookieElement} />;
  }

  return (
    <AuthProvider {...authProviderProps}>
      <OIDCSecured cookieElement={cookieElement} setCookieElement={setCookieElement} microFrontendConfig={state.microFrontendConfig}>
        {children}
      </OIDCSecured>
    </AuthProvider>
  );
};

export default OIDCProvider;
