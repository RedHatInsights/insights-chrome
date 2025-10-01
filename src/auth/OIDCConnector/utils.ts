import { AuthContextProps } from 'react-oidc-context';
import { ITLess, LOGIN_SCOPES_STORAGE_KEY, deleteLocalStorageItems } from '../../utils/common';
import { GLOBAL_FILTER_KEY, OFFLINE_REDIRECT_STORAGE_KEY } from '../../utils/consts';
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

export function login(auth: AuthContextProps, requiredScopes: string[] = [], redirectUri = location.href) {
  log('Logging in');
  // Redirect to login
  Cookies.set('cs_loggedOut', 'false');
  //FIX ME: Temp fix until scope is added in-boundary
  let scope = ITLess() ? ['openid', ...requiredScopes] : ['openid', 'api.console', 'api.ask_red_hat', ...requiredScopes];
  const partner = getPartnerScope(window.location.pathname);
  if (partner) {
    scope.push(partner);
  }

  scope = Array.from(new Set(scope));
  localStorage.setItem(LOGIN_SCOPES_STORAGE_KEY, JSON.stringify(scope));
  // KC scopes are delimited by a space character, hence the join(' ')
  return auth.signinRedirect({
    redirect_uri: redirectUri,
    scope: scope.join(' '),
    nonce: createUUID(),
  });
}
