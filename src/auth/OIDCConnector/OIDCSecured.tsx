import React, { useEffect, useRef, useState } from 'react';
import { hasAuthParams, useAuth } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import { BroadcastChannel } from 'broadcast-channel';
import { useDispatch, useStore } from 'react-redux';
import { ChromeUser } from '@redhat-cloud-services/types';
import ChromeAuthContext, { ChromeAuthContextValue } from '../ChromeAuthContext';
import { generateRoutesList } from '../../utils/common';
import { loadModulesSchema } from '../../redux/actions';
import getInitialScope from '../getInitialScope';
import { init } from '../../utils/iqeEnablement';
import entitlementsApi from '../entitlementsApi';
import { initializeVisibilityFunctions } from '../../utils/VisibilitySingleton';
import sentry from '../../utils/sentry';
import AppPlaceholder from '../../components/AppPlaceholder';
import { FooterProps } from '../../components/Footer/Footer';
import logger from '../logger';
import { login, logout } from './utils';
import createGetUserPermissions from '../createGetUserPermissions';
import initializeAccessRequestCookies from '../initializeAccessRequestCookies';
import { getOfflineToken, prepareOfflineRedirect } from '../offline';
import { OFFLINE_REDIRECT_STORAGE_KEY } from '../../utils/consts';
import { setCookie } from '../setCookie';

type Entitlement = { is_entitled: boolean; is_trial: boolean };
const serviceAPI = entitlementsApi();
const authChannel = new BroadcastChannel('auth');
const log = logger('OIDCSecured.tsx');

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOIDCUserToChromeUser(user: User | Record<string, any>, entitlements: { [entitlement: string]: Entitlement }): ChromeUser {
  return {
    scope: [],
    entitlements,
    identity: {
      org_id: user.profile?.org_id as any,
      type: user.profile?.type as any,
      account_number: user.profile?.account_number as any,
      internal: {
        org_id: user.profile?.org_id as any,
        account_id: user.profile?.account_id as any,
      },
      user: {
        email: user.profile?.email as any,
        first_name: user.profile?.first_name as any,
        last_name: user.profile?.last_name as any,
        is_active: user.profile?.is_active as any,
        is_org_admin: user.profile?.is_org_admin as any,
        is_internal: user.profile?.is_internal as any,
        locale: user.profile?.locale as any,
        username: user.profile?.username as any,
      },
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchEntitlements(user: User) {
  let entitlements: { [entitlement: string]: Entitlement } = {};
  try {
    if (user.profile.org_id) {
      entitlements = (await serviceAPI.servicesGet()) as unknown as typeof entitlements;
      return entitlements;
    } else {
      console.log('Cannot call entitlements API, no account number');
      return entitlements;
    }
  } catch {
    // let's swallow error from services API
    return entitlements;
  }
}

export function OIDCSecured({
  children,
  microFrontendConfig,
  cookieElement,
  setCookieElement,
}: React.PropsWithChildren<{ microFrontendConfig: Record<string, any> } & FooterProps>) {
  const auth = useAuth();
  const authRef = useRef(auth);
  const store = useStore();
  const dispatch = useDispatch();
  const [state, setState] = useState<ChromeAuthContextValue>({
    ready: false,
    logoutAllTabs: (bounce = true) => {
      authChannel.postMessage({ type: 'logout' });
      logout(authRef.current, bounce);
    },
    logout: () => {
      logout(authRef.current, true);
    },
    login: (requiredScopes) => login(authRef.current, requiredScopes),
    loginAllTabs: () => {
      authChannel.postMessage({ type: 'login' });
    },
    getToken: () => Promise.resolve(authRef.current.user?.access_token ?? ''),
    getRefreshToken: () => Promise.resolve(authRef.current.user?.refresh_token ?? ''),
    getOfflineToken: () => {
      const redirectUri = new URL(localStorage.getItem(OFFLINE_REDIRECT_STORAGE_KEY) || `${window.location.origin}${window.location.pathname}`);
      return getOfflineToken(
        authRef.current.settings.metadata?.token_endpoint ?? '',
        authRef.current.settings.client_id,
        encodeURIComponent(redirectUri.toString().split('#')[0])
      );
    },
    doOffline: () => login(authRef.current, ['offline_access'], prepareOfflineRedirect()),
    getUser: () => Promise.resolve(mapOIDCUserToChromeUser(authRef.current.user ?? {}, {})),
    token: authRef.current.user?.access_token ?? '',
    tokenExpires: authRef.current.user?.expires_at ?? 0,
    user: mapOIDCUserToChromeUser(authRef.current.user ?? {}, {}),
  });

  const startChrome = async () => {
    const routes = generateRoutesList(microFrontendConfig);
    dispatch(loadModulesSchema(microFrontendConfig));

    const initialModuleScope = getInitialScope(routes, window.location.pathname);

    const initialModuleConfig = initialModuleScope && microFrontendConfig[initialModuleScope]?.config;
    initializeAccessRequestCookies();

    if (!hasAuthParams() && !auth.activeNavigator && !auth.isLoading && !auth.isAuthenticated) {
      login(auth, initialModuleConfig?.ssoScopes);
    }
  };

  async function onUserAuthenticated(user: User) {
    // order of calls is important
    // init the IQE enablement first to add the necessary auth headers to the requests
    init(store, user.access_token);
    const entitlements = await fetchEntitlements(user);
    const chromeUser = mapOIDCUserToChromeUser(user, entitlements);
    const getUser = () => Promise.resolve(chromeUser);
    initializeVisibilityFunctions({
      getUser,
      getToken: () => Promise.resolve(user.access_token),
      getUserPermissions: createGetUserPermissions(getUser, () => Promise.resolve(user.access_token)),
    });
    setState((prev) => ({
      ...prev,
      ready: true,
      getUser,
      user: chromeUser,
      token: user.access_token,
      tokenExpires: user.expires_at!,
    }));
    sentry(chromeUser);
  }

  useEffect(() => {
    const user = auth.user;
    if (auth.isAuthenticated && user) {
      onUserAuthenticated(user);
      authChannel.onmessage = (e) => {
        if (e && e.data && e.data.type) {
          log(`BroadcastChannel, Received event : ${e.data.type}`);

          // TODO: handle scopes
          switch (e.data.type) {
            case 'logout':
              return state.logout();
            case 'login':
              return state.login();
            case 'refresh':
              return auth.signinSilent();
          }
        }
      };
    }
  }, [JSON.stringify(auth.user), auth.isAuthenticated]);

  useEffect(() => {
    if (!auth.error) {
      startChrome();
    }
  }, [auth]);

  useEffect(() => {
    authRef.current = auth;
    setCookie(authRef.current?.user?.access_token ?? '', authRef.current.user?.expires_at ?? 0);
  }, [auth]);

  if (!auth.isAuthenticated || !state.ready) {
    return <AppPlaceholder cookieElement={cookieElement} setCookieElement={setCookieElement} />;
  }

  return <ChromeAuthContext.Provider value={state}>{children}</ChromeAuthContext.Provider>;
}
