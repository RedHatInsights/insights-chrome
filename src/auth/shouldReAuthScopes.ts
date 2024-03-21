import { LOGIN_SCOPES_STORAGE_KEY } from '../utils/common';

const getCurrentScopes = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_SCOPES_STORAGE_KEY) || '[]');
  } catch {
    // unable to parse scopes because the entry does not exist or the entry is not an array
    return [];
  }
};

function shouldReAuthScopes(requiredScopes: string[], additionalScopes: string[] = []): [boolean, string[]] {
  const currentScopes = getCurrentScopes();
  const neededScopes = [...requiredScopes, ...additionalScopes];
  const missingScope = neededScopes.some((scope) => !currentScopes.includes(scope));
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
  const newScopes = shouldReAuth ? Array.from(new Set([...neededScopes, ...currentScopes])) : [];
  return [!!shouldReAuth, newScopes];
}

export default shouldReAuthScopes;
