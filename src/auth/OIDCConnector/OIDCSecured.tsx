import React, { useEffect, useRef, useState } from 'react';
import { hasAuthParams, useAuth } from 'react-oidc-context';
import { User } from 'oidc-client-ts';
import { BroadcastChannel } from 'broadcast-channel';
import { ChromeUser } from '@redhat-cloud-services/types';
import ChromeAuthContext, { ChromeAuthContextValue } from '../ChromeAuthContext';
import { generateRoutesList } from '../../utils/common';
import getInitialScope from '../getInitialScope';
import { init } from '../../utils/iqeEnablement';
import entitlementsApi from '../entitlementsApi';
import sentry from '../../utils/sentry';
import AppPlaceholder from '../../components/AppPlaceholder';
import logger from '../logger';
import { login, logout } from './utils';
import initializeAccessRequestCookies from '../initializeAccessRequestCookies';
import { getOfflineToken, prepareOfflineRedirect } from '../offline';
import { OFFLINE_REDIRECT_STORAGE_KEY, RH_USER_ID_STORAGE_KEY } from '../../utils/consts';
import { useSetAtom } from 'jotai';
import { writeInitialScalprumConfigAtom } from '../../state/atoms/scalprumConfigAtom';
import { setCookie } from '../setCookie';
import { useAtomValue } from 'jotai';
import shouldReAuthScopes from '../shouldReAuthScopes';
import { activeModuleDefinitionReadAtom } from '../../state/atoms/activeModuleAtom';
import { loadModulesSchemaWriteAtom } from '../../state/atoms/chromeModuleAtom';
import chromeStore from '../../state/chromeStore';
import useManageSilentRenew from './useManageSilentRenew';
import { ServicesGetReturnType } from '@redhat-cloud-services/entitlements-client';
import { silentReauthEnabledAtom } from '../../state/atoms/silentReauthAtom';

type Entitlement = { is_entitled: boolean; is_trial: boolean };
const serviceAPI = entitlementsApi();
const authChannel = new BroadcastChannel('auth');
const log = logger('OIDCSecured.tsx');

/**
 * Checks if an error is an expected OIDC silent authentication error.
 * These errors occur when prompt=none is used but the IdP cannot complete
 * the request without user interaction (e.g., session expired, consent needed).
 *
 * Per OIDC spec, the proper recovery is to redirect to the authorization endpoint
 * without prompt=none to allow user interaction.
 *
 * @param error - The error object to check
 * @returns true if this is an expected silent auth error, false otherwise
 *
 * Refs:
 * - OIDC Core spec: https://openid.net/specs/openid-connect-core-1_0.html#AuthError
 * - ErrorResponse structure: https://github.com/authts/oidc-client-ts/blob/main/src/errors/ErrorResponse.ts
 */
function isExpectedSilentAuthError(error: any): boolean {
  return (
    error?.name === 'ErrorResponse' &&
    [
      'interaction_required', // User interaction is required (e.g., registration form)
      'login_required', // User must log in (session expired)
      'consent_required', // User must consent to requested scopes
      'account_selection_required', // User must select an account
    ].includes(error?.message)
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOIDCUserToChromeUser(user: User | Record<string, any>, entitlements: ServicesGetReturnType): ChromeUser {
  return {
    // The client is missing the trial type on the response
    entitlements: entitlements as Record<string, Entitlement>,
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
      organization: user.profile?.organization as any,
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchEntitlements(user: User) {
  let entitlements: ServicesGetReturnType = {};
  try {
    if (user.profile.org_id) {
      entitlements = (await serviceAPI.servicesGet({})).data;
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

export function OIDCSecured({ children, microFrontendConfig, ssoUrl }: React.PropsWithChildren<{ microFrontendConfig: Record<string, any>; ssoUrl: string }>) {
  const auth = useAuth();
  const authRef = useRef(auth);
  const setScalprumConfigAtom = useSetAtom(writeInitialScalprumConfigAtom);
  const loadModulesSchema = useSetAtom(loadModulesSchemaWriteAtom);
  const silentReauthEnabled = useAtomValue(silentReauthEnabledAtom);
  const silentReauthEnabledRef = useRef(silentReauthEnabled);

  // get scope module definition
  const activeModule = useAtomValue(activeModuleDefinitionReadAtom);
  const requiredScopes = React.useMemo(
    () => activeModule?.config?.ssoScopes || activeModule?.moduleConfig?.ssoScopes || [],
    [activeModule?.config?.ssoScopes, activeModule?.moduleConfig?.ssoScopes]
  );

  // Keep ref in sync with current value
  useEffect(() => {
    silentReauthEnabledRef.current = silentReauthEnabled;
  }, [silentReauthEnabled]);

  const reAuthWithScopes = React.useCallback(
    async (...additionalScopes: string[]) => {
      if (!silentReauthEnabledRef.current) {
        const [shouldReAuth, reAuthScopes] = shouldReAuthScopes(requiredScopes, additionalScopes);
        if (shouldReAuth) {
          return login(authRef.current, reAuthScopes);
        }
        return;
      }

      // Merge and deduplicate scopes using Set
      const scopeSet = new Set([...requiredScopes, ...additionalScopes].flat());
      if (authRef.current.user?.scope) {
        authRef.current.user.scope.split(' ').forEach((s) => scopeSet.add(s));
      }
      const scopes = Array.from(scopeSet);
      log(`Re-authenticating with scopes: ${scopes.join(' ')}`);
      return auth
        .signinSilent({
          scope: scopes.join(' '),
          prompt: 'none',
          forceIframeAuth: true,
        })
        .then((user) => {
          if (user === null) {
            log('Silent reauth returned null, falling back to hard reauth');
            login(authRef.current, scopes);
          }
        })
        .catch((error) => {
          if (isExpectedSilentAuthError(error)) {
            log(`Silent reauth failed with expected error: ${error.message}, falling back to login`);
          } else {
            console.error('Unexpected error while re-authenticating user', error);
          }

          // Always fall back to full login redirect
          login(authRef.current, scopes);
        });
    },
    [auth, requiredScopes]
  );
  const [state, setState] = useState<ChromeAuthContextValue>({
    ssoUrl,
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
    forceRefresh: () => Promise.resolve(),
    doOffline: () => login(authRef.current, ['offline_access'], prepareOfflineRedirect()),
    getUser: () => Promise.resolve(mapOIDCUserToChromeUser(authRef.current.user ?? {}, {})),
    token: authRef.current.user?.access_token ?? '',
    refreshToken: authRef.current.user?.refresh_token ?? '',
    tokenExpires: authRef.current.user?.expires_at ?? 0,
    user: mapOIDCUserToChromeUser(authRef.current.user ?? {}, {}),
    reAuthWithScopes,
    loginSilent: async () => {
      await auth.signinSilent();
    },
  });

  const startChrome = async () => {
    const routes = generateRoutesList(microFrontendConfig);
    loadModulesSchema(microFrontendConfig);
    // eventually all attributes will be stored in jotai atom
    setScalprumConfigAtom(microFrontendConfig);

    const initialModuleScope = getInitialScope(routes, window.location.pathname);
    const initialModuleConfig =
      initialModuleScope && (microFrontendConfig[initialModuleScope]?.config || microFrontendConfig[initialModuleScope]?.moduleConfig);
    initializeAccessRequestCookies();

    if (!hasAuthParams() && !auth.activeNavigator && !auth.isLoading && !auth.isAuthenticated) {
      login(auth, initialModuleConfig?.ssoScopes);
    }
  };

  async function onUserAuthenticated(user: User) {
    // order of calls is important
    // init the IQE enablement first to add the necessary auth headers to the requests
    init(chromeStore, authRef);
    const entitlements = await fetchEntitlements(user);
    const chromeUser = mapOIDCUserToChromeUser(user, entitlements);
    const getUser = () => Promise.resolve(chromeUser);
    setState((prev) => ({
      ...prev,
      ready: true,
      getUser,
      user: chromeUser,
      token: user.access_token,
      tokenExpires: user.expires_at!,
      forceRefresh: authRef.current.signinSilent,
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
    function onRenewError(error: Error) {
      console.error('Silent renew error', error);
      state.login();
    }
    auth.events.addSilentRenewError(onRenewError);

    return () => {
      auth.events.removeSilentRenewError(onRenewError);
    };
    // to ensure we are not re-initializing the chrome on every auth change
    // only on the important events
  }, [auth.error, auth.isLoading, auth.isAuthenticated, state.token, state.user?.identity?.account_number]);

  useEffect(() => {
    authRef.current = auth;
    setCookie(auth.user?.access_token ?? '', auth.user?.expires_at ?? 0);
    // currently uses the deprecated user_id claim on the user profile - will need to be updated if switching to sub claim in the future
    if (auth.user?.profile.user_id && typeof auth.user.profile.user_id === 'string') {
      localStorage.setItem(RH_USER_ID_STORAGE_KEY, auth.user.profile.user_id);
    }
  }, [auth]);

  useManageSilentRenew(auth, state.login);

  if (auth.error) {
    if (isExpectedSilentAuthError(auth.error)) {
      log(`Silent auth failed with expected error: ${auth.error.message}, falling back to full login`);
      state.login();
      return <AppPlaceholder />;
    }

    // Unexpected error - throw to error boundary
    throw auth.error;
  }

  if (!auth.isAuthenticated || !state.ready) {
    return <AppPlaceholder />;
  }

  return <ChromeAuthContext.Provider value={state}>{children}</ChromeAuthContext.Provider>;
}
