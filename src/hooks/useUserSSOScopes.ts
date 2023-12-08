import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ReduxState } from '../redux/store';
import { LOGIN_SCOPES_STORAGE_KEY } from '../utils/common';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { useAtomValue } from 'jotai';
import { activeModuleAtom } from '../state/atoms';

/**
 * If required, attempt to reauthenticate current user with full profile login.
 */
const useUserSSOScopes = () => {
  const { login } = useContext(ChromeAuthContext);
  const getCurrentScopes = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(LOGIN_SCOPES_STORAGE_KEY) || '[]');
    } catch {
      // unable to parse scopes because the entry does not exist or the entry is not an array
      return [];
    }
  };
  const activeModuleId = useAtomValue(activeModuleAtom);
  // get scope module definition
  const activeModule = useSelector(({ chrome: { modules } }: ReduxState) => (activeModuleId ? (modules || {})[activeModuleId] : undefined));
  const requiredScopes = activeModule?.config?.ssoScopes || [];

  useEffect(() => {
    const currentScopes = getCurrentScopes();
    const requiredScopes = activeModule?.config?.ssoScopes || [];
    const missingScope = requiredScopes.some((scope) => !currentScopes.includes(scope));

    const shouldReAuth =
      // normal scenario for account that was not authenticated with required scopes
      missingScope ||
      // scenario accounts that were redirected from sso and might not have completed required steps (like completing full profile registration)
      (requiredScopes.length > 0 && !missingScope && document.referrer.match(/sso\.[a-z]+\.redhat\.com/));

    /**
     * FIXME: RHFULL scope (and all legacy scopes??) are not showing up in the token response, so we don't know if the scope was authenticated
     * Work with #forum-ciam and the `@ciam-s-client-integration-sre` to fix that
     *  */
    // if current login scope is not full profile and scope requires it, trigger full profile login`
    if (shouldReAuth) {
      login(Array.from(new Set([...requiredScopes, ...currentScopes])));
    }
  }, [requiredScopes, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
