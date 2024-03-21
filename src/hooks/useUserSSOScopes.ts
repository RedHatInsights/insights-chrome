import { useContext, useEffect } from 'react';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { useAtomValue } from 'jotai';
import { activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import shouldReAuthScopes from '../auth/shouldReAuthScopes';

/**
 * If required, attempt to reauthenticate current user with additional scopes.
 */
const useUserSSOScopes = () => {
  const { login } = useContext(ChromeAuthContext);
  const activeModule = useAtomValue(activeModuleDefinitionReadAtom);
  // get scope module definition
  const requiredScopes = activeModule?.config?.ssoScopes || [];

  useEffect(() => {
    const [shouldReAuth, newScopes] = shouldReAuthScopes(requiredScopes);
    if (shouldReAuth) {
      login(newScopes);
    }
  }, [requiredScopes, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
