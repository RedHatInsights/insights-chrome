import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ReduxState } from '../redux/store';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { useAtomValue } from 'jotai';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import shouldReAuthScopes from '../auth/shouldReAuthScopes';

/**
 * If required, attempt to reauthenticate current user with additional scopes.
 */
const useUserSSOScopes = () => {
  const { login } = useContext(ChromeAuthContext);

  const activeModuleId = useAtomValue(activeModuleAtom);
  // get scope module definition
  const activeModule = useSelector(({ chrome: { modules } }: ReduxState) => (activeModuleId ? (modules || {})[activeModuleId] : undefined));
  const requiredScopes = activeModule?.config?.ssoScopes || [];

  useEffect(() => {
    const [shouldReAuth, newScopes] = shouldReAuthScopes(requiredScopes);
    if (shouldReAuth) {
      login(newScopes);
    }
  }, [requiredScopes, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
