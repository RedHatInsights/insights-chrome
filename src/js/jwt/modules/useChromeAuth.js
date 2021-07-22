import { wipePostbackParamsThatAreNotForUs, getOfflineToken } from '../insights/offline';

import * as jwt from '../jwt';
import cookie from 'js-cookie';
import { options as defaultOptions } from '../constants';
const TIMER_STR = '[JWT][jwt.js] Auth time';

function bouncer() {
  if (!jwt.isAuthenticated()) {
    cookie.remove(defaultOptions.cookieName);
    jwt.login();
  }

  console.timeEnd(TIMER_STR); // eslint-disable-line no-console
}

export const initChromeAuth = () => {
  console.time(TIMER_STR); // eslint-disable-line no-console
  let options = {
    ...defaultOptions,
  };

  wipePostbackParamsThatAreNotForUs();
  const token = cookie.get(options.cookieName);
  const refreshToken = cookie.get('cs_jwt_refresh');

  // If we find an existing token, use it
  // so that we dont auth even when a valid token is present
  // otherwise its quick, but we bounce around and get a new token
  // on every page load
  if (token && token.length > 10 && refreshToken && refreshToken.length > 10) {
    options.refreshToken = refreshToken;
    options.token = token;
  }

  const promise = jwt.init(options).then(bouncer);

  return {
    initPromise: promise,
  };
};

const useChromeAuth = () => {
  let options = {
    ...defaultOptions,
  };

  return {
    getOfflineToken: () => {
      return getOfflineToken(options.realm, options.clientId);
    },
    ...jwt,
  };
};

export default useChromeAuth;
