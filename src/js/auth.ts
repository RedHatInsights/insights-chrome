import { getOfflineToken, wipePostbackParamsThatAreNotForUs } from './jwt/insights/offline';
import * as jwt from './jwt/jwt';
import cookie from 'js-cookie';
import { options as defaultOptions } from './jwt/constants';
import { ACCOUNT_REQUEST_TIMEOUT, ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER } from './consts';
const TIMER_STR = '[JWT][jwt.js] Auth time';

function bouncer() {
  if (!jwt.isAuthenticated()) {
    cookie.remove(defaultOptions.cookieName);
    jwt.login();
  }

  console.timeEnd(TIMER_STR); // eslint-disable-line no-console
}

export function crossAccountBouncer() {
  const requestCookie = cookie.get(CROSS_ACCESS_ACCOUNT_NUMBER);
  if (requestCookie) {
    localStorage.setItem(ACCOUNT_REQUEST_TIMEOUT, requestCookie);
    localStorage.removeItem(ACTIVE_REMOTE_REQUEST);
  }
  cookie.remove(CROSS_ACCESS_ACCOUNT_NUMBER);
  window.location.reload();
}

export default ({ ssoUrl }: { ssoUrl?: string }) => {
  console.time(TIMER_STR); // eslint-disable-line no-console
  const options = {
    ...defaultOptions,
  };

  wipePostbackParamsThatAreNotForUs();
  const token = cookie.get(options.cookieName);
  const refreshToken = localStorage.getItem('cs_jwt_refresh');

  // If we find an existing token, use it
  // so that we dont auth even when a valid token is present
  // otherwise its quick, but we bounce around and get a new token
  // on every page load
  if (token && token.length > 10 && refreshToken && refreshToken.length > 10) {
    options.refreshToken = refreshToken;
    options.token = token;
  }

  const promise = jwt.init(options, ssoUrl).then(bouncer);

  return {
    getOfflineToken: () => getOfflineToken(options.realm, options.clientId, ssoUrl),
    jwt: jwt,
    initPromise: promise,
  };
};
