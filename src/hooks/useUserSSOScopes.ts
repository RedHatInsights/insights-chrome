import { useEffect } from 'react';
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

  useEffect(() => {
    if (requiredScopes.length <= 0) {
      return;
    }
    if (silentReauthEnabled) {
      setAuthScopeReady(false);
      reAuthWithScopes(...requiredScopes).then(() => {
        setAuthScopeReady(true);
      });
    } else {
      const [shouldReAuth, newScopes] = shouldReAuthScopes(requiredScopes);
      if (shouldReAuth) {
        login(newScopes);
      }
    }
  }, [silentReauthEnabled, requiredScopes, setAuthScopeReady, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
