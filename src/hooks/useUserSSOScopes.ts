import { useEffect } from 'react';
import { ChromeLogin } from '../auth/ChromeAuthContext';
import { useAtomValue } from 'jotai';
import { activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import shouldReAuthScopes from '../auth/shouldReAuthScopes';

/**
 * If required, attempt to reauthenticate current user with additional scopes.
 */
const useUserSSOScopes = (login: ChromeLogin) => {
  const activeModule = useAtomValue(activeModuleDefinitionReadAtom);
  // get scope module definition
  const requiredScopes = activeModule?.config?.ssoScopes || activeModule?.moduleConfig?.ssoScopes || [];

  useEffect(() => {
    const [shouldReAuth, newScopes] = shouldReAuthScopes(requiredScopes);
    if (shouldReAuth) {
      login(newScopes);
    }
  }, [requiredScopes, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
