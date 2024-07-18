import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SSO_ROUTES, ITLess, isBeta, loadFedModules } from '../../utils/common';
import { AuthProvider, AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import platformUrl from '../platformUrl';
import { OIDCSecured } from './OIDCSecured';
import AppPlaceholder from '../../components/AppPlaceholder';
import { postbackUrlSetup } from '../offline';

const LOCAL_PREVIEW = localStorage.getItem('chrome:local-preview') === 'true';
// TODO: remove this once the local preview is enabled by default
const betaPartial = LOCAL_PREVIEW ? '' : isBeta() ? '/beta' : '';

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

  const authProviderProps: AuthProviderProps = useMemo(
    () => ({
      client_id: ITLess() ? 'console-dot' : 'cloud-services',
      silent_redirect_uri: `https://${window.location.host}${betaPartial}/apps/chrome/silent-check-sso.html`,
      automaticSilentRenew: true,
      redirect_uri: `${window.location.origin}`,
      authority: `${state?.ssoUrl}`,
      metadataUrl: '/realms/redhat-external/protocol/openid-connect/auth',
      monitorSession: true,
      metadata: {
        authorization_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/auth`,
        token_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/token`,
        end_session_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/logout`,
        check_session_iframe: `https://${window.location.host}${betaPartial}/apps/chrome/silent-check-sso.html`,
        revocation_endpoint: `${state?.ssoUrl}realms/redhat-external/protocol/openid-connect/revoke`,
      },
      // removes code_challenge query param from the url
      disablePKCE: true,
      response_type: 'code',
      response_mode: 'fragment',
      onSigninCallback: () => {
        const startUrl = new URL(window.location.href);
        // remove the SSO code params from the URL
        startUrl.hash = '';
        window.history.replaceState({}, document.title, startUrl);
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
      <OIDCSecured
        ssoUrl={state.ssoUrl}
        cookieElement={cookieElement}
        setCookieElement={setCookieElement}
        microFrontendConfig={state.microFrontendConfig}
      >
        {children}
      </OIDCSecured>
    </AuthProvider>
  );
};

export default OIDCProvider;
