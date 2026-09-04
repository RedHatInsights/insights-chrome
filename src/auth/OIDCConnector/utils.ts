import { AuthContextProps } from 'react-oidc-context';
import { ITLess, LOGIN_SCOPES_STORAGE_KEY, deleteLocalStorageItems } from '../../utils/common';
import { GLOBAL_FILTER_KEY, OFFLINE_REDIRECT_STORAGE_KEY, OIDC_RESERVED_PARAMS } from '../../utils/consts';
import Cookies from 'js-cookie';
import logger from '../logger';
import createUUID from './createUUID';

const log = logger('auth:utils');

enum AllowedPartnerScopes {
  aws = 'aws',
  azure = 'azure',
  gcp = 'gcp',
}

function isPartnerScope(scope: string): scope is AllowedPartnerScopes {
  return Object.values(AllowedPartnerScopes).includes(scope as AllowedPartnerScopes);
}

function getPartnerScope(pathname: string) {
  // replace beta and leading "/"
  const sanitizedPathname = pathname.replace(/^(\/beta\/|\/preview\/)/, '/').replace(/^\//, '');
  // check if the pathname is connect/:partner
  if (sanitizedPathname.match(/^connect\/.+/)) {
    // return :partner param
    const fragmentScope = sanitizedPathname.split('/')[1];
    if (isPartnerScope(fragmentScope)) {
      return `api.partner_link.${fragmentScope}`;
    }
    log(`Invalid stratosphere scope: ${fragmentScope}`);
    return undefined;
  }

  return undefined;
}

export async function logout(auth: AuthContextProps, bounce?: boolean) {
  const keys = Object.keys(localStorage).filter(
    (key) =>
      key.endsWith('/api/entitlements/v1/services') ||
      key.endsWith('/chrome') ||
      key.endsWith('/chrome-store') ||
      key.startsWith('kc-callback') ||
      key.startsWith(GLOBAL_FILTER_KEY)
  );
  deleteLocalStorageItems([...keys, OFFLINE_REDIRECT_STORAGE_KEY, LOGIN_SCOPES_STORAGE_KEY]);
  if (bounce) {
    const eightSeconds = new Date(new Date().getTime() + 8 * 1000);
    Cookies.set('cs_loggedOut', 'true', {
      expires: eightSeconds,
    });
    await auth.signoutRedirect({
      redirectTarget: 'top',
      post_logout_redirect_uri: window.location.origin,
      id_token_hint: undefined,
    });
  } else {
    await auth.revokeTokens(['access_token', 'refresh_token']);
  }
}

/**
 * Removes OIDC-reserved parameters from a URL so they are never forwarded to Red Hat
 * SSO inside an outgoing `redirect_uri`. SSO rejects authorization requests whose
 * redirect_uri contains any of these (see {@link OIDC_RESERVED_PARAMS}); they leak in
 * via the back button, a copy-pasted URL, or an interrupted auth cycle.
 *
 * Only the reserved params are stripped — legitimate params survive the login
 * round-trip: query params (e.g. `noauth`, `from-aws`) and fragment content
 * (e.g. global-filter `workloads`/`tags`, or a plain `#anchor`).
 */
export function sanitizeRedirectUri(href: string = location.href): string {
  const url = new URL(href);
  const reserved: readonly string[] = OIDC_RESERVED_PARAMS;

  // strip reserved params from the query string
  reserved.forEach((param) => url.searchParams.delete(param));

  // strip reserved params from the fragment while keeping legit fragment content
  // (e.g. global-filter `workloads`/`tags`) and plain `#anchor` values intact
  if (url.hash) {
    const kept = url.hash
      .replace(/^#/, '')
      .split('&')
      .filter((entry) => entry.length > 0 && !reserved.includes(entry.split('=')[0]));
    url.hash = kept.join('&');
  }

  return url.toString();
}

export function login(auth: AuthContextProps, requiredScopes: string[] = [], redirectUri = location.href) {
  log('Logging in');
  // Redirect to login
  Cookies.set('cs_loggedOut', 'false');
  //FIX ME: Temp fix until scope is added in-boundary
  let scope = ITLess() ? ['openid', ...requiredScopes] : ['openid', 'api.console', 'api.ask_red_hat', 'api.graphql', ...requiredScopes];
  const partner = getPartnerScope(window.location.pathname);
  if (partner) {
    scope.push(partner);
  }

  scope = Array.from(new Set(scope));
  localStorage.setItem(LOGIN_SCOPES_STORAGE_KEY, JSON.stringify(scope));
  // KC scopes are delimited by a space character, hence the join(' ')
  return auth.signinRedirect({
    // sanitize here so both the default (location.href) and any explicitly-passed
    // redirectUri are stripped of OIDC-reserved params before reaching SSO
    redirect_uri: sanitizeRedirectUri(redirectUri),
    scope: scope.join(' '),
    nonce: createUUID(),
  });
}
