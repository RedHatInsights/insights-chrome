import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChromeLogin } from '../auth/ChromeAuthContext';
import { activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import shouldReAuthScopes from '../auth/shouldReAuthScopes';
import { routeAuthScopeReady } from '../state/atoms/routeAuthScopeReady';

type UseUserSSOScopesOptions = {
  login: ChromeLogin;
  reAuthWithScopes: (...scopes: string[]) => Promise<void>;
  silentReauthEnabled: boolean;
};

/**
 * Unifed SSO scopes hook. When silent reauth is enabled, it performs silent reauth and
 * sets the routeAuthScopeReady flag appropriately. When disabled, it uses legacy behavior
 * and triggers a login if new scopes are required.
 */
const useUserSSOScopes = ({ login, reAuthWithScopes, silentReauthEnabled }: UseUserSSOScopesOptions) => {
  const activeModule = useAtomValue(activeModuleDefinitionReadAtom);
  const setAuthScopeReady = useSetAtom(routeAuthScopeReady);
  // get scope module definition
  const requiredScopes = activeModule?.config?.ssoScopes || activeModule?.moduleConfig?.ssoScopes || [];

  // Use refs to avoid re-running effect when function references change
  const loginRef = useRef(login);
  const reAuthWithScopesRef = useRef(reAuthWithScopes);

  useEffect(() => {
    loginRef.current = login;
    reAuthWithScopesRef.current = reAuthWithScopes;
  });

  useEffect(() => {
    if (requiredScopes.length <= 0) {
      setAuthScopeReady(true);
      return;
    }
    if (silentReauthEnabled) {
      setAuthScopeReady(false);
      reAuthWithScopesRef.current(...requiredScopes).then(() => {
        setAuthScopeReady(true);
      });
    } else {
      const [shouldReAuth, newScopes] = shouldReAuthScopes(requiredScopes);
      if (shouldReAuth) {
        loginRef.current(newScopes);
      }
    }
  }, [silentReauthEnabled, requiredScopes, setAuthScopeReady, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
