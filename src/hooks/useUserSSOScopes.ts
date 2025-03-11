import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import { routeAuthScopeReady } from '../state/atoms/routeAuthScopeReady';

/**
 * If required, attempt to reauthenticate current user with additional scopes.
 */
const useUserSSOScopes = (reAuthWithScopes: (...scopes: string[]) => Promise<void>) => {
  const activeModule = useAtomValue(activeModuleDefinitionReadAtom);
  const setAuthScopeReady = useSetAtom(routeAuthScopeReady);
  // get scope module definition
  const requiredScopes = activeModule?.config?.ssoScopes || [];

  useEffect(() => {
    if (requiredScopes.length > 0) {
      setAuthScopeReady(false);
      reAuthWithScopes(...requiredScopes).then(() => {
        setAuthScopeReady(true);
      });
    }
  }, [requiredScopes, setAuthScopeReady]);
};

export default useUserSSOScopes;
