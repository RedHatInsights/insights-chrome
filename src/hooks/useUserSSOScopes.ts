import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { login } from '../jwt/jwt';
import { ReduxState } from '../redux/store';
import { LOGIN_SCOPES_STORAGE_KEY } from '../utils/common';

/**
 * If required, attempt to reauthenticate current user with full profile login.
 */
const useUserSSOScopes = () => {
  const getCurrentScopes = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(LOGIN_SCOPES_STORAGE_KEY) || '[]');
    } catch {
      // unable to parse scopes because the entry does not exist or the entry is not an array
      return [];
    }
  };
  // get scope module definition
  const activeModule = useSelector(({ chrome: { activeModule, modules } }: ReduxState) => (activeModule ? (modules || {})[activeModule] : undefined));
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

    // if current login scope is not full profile and scope requires it, trigger full profile login`
    if (shouldReAuth) {
      login(requiredScopes);
    }
  }, [requiredScopes, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
