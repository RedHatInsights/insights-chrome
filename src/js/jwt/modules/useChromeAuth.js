import { wipePostbackParamsThatAreNotForUs, getOfflineToken } from '../insights/offline';

import flatten from 'lodash/flatten';

import * as jwt from '../jwt';
import cookie from 'js-cookie';
import { options as defaultOptions, allowedUnauthedPaths } from '../constants';
const TIMER_STR = '[JWT][jwt.js] Auth time';

function bouncer() {
  if (allowUnauthed()) {
    return;
  }

  if (!jwt.isAuthenticated()) {
    cookie.remove(defaultOptions.cookieName);
    jwt.login();
  }

  console.timeEnd(TIMER_STR); // eslint-disable-line no-console
}

function getAllowedUnauthedPaths() {
  return flatten(allowedUnauthedPaths.map((e) => [e, e + '/']));
}

export function allowUnauthed() {
  if (getAllowedUnauthedPaths().includes(window.location.pathname)) {
    return true;
  }

  return false;
}

export const initChromeAuth = () => {
  console.time(TIMER_STR); // eslint-disable-line no-console
  let options = {
    ...defaultOptions,
  };

  wipePostbackParamsThatAreNotForUs();
  const token = cookie.get(options.cookieName);

  // If we find an existing token, use it
  // so that we dont auth even when a valid token is present
  // otherwise its quick, but we bounce around and get a new token
  // on every page load
  if (token && token.length > 10) {
    options.token = token;
    options.refreshToken = cookie.get('cs_jwt_refresh');
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
