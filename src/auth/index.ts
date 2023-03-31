import { getOfflineToken, wipePostbackParamsThatAreNotForUs } from '../jwt/offline';
import { AxiosResponse } from 'axios';
import cookie from 'js-cookie';
import { ChromeUser } from '@redhat-cloud-services/types';
import { Store } from 'redux';

import * as jwt from '../jwt/jwt';
import { getTokenWithAuthorizationCode } from '../cognito/auth';
import { ITLess } from '../utils/common';
import consts, { defaultAuthOptions as defaultOptions } from '../utils/consts';
import { ACCOUNT_REQUEST_TIMEOUT, ACTIVE_REMOTE_REQUEST, CROSS_ACCESS_ACCOUNT_NUMBER, CROSS_ACCESS_ORG_ID } from '../utils/consts';
import qe from '../utils/iqeEnablement';
import { ChromeModule } from '../@types/types';

export type LibJWT = {
  getOfflineToken: () => Promise<AxiosResponse<any>>;
  jwt: typeof jwt;
  initPromise: Promise<void>;
};

const TIMER_STR = '[JWT][jwt.js] Auth time';
const isITLessEnv = ITLess();
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
  cookie.remove(CROSS_ACCESS_ORG_ID);
  window.location.reload();
}

export type ChromeGlobalConfig = { chrome?: ChromeModule };

export const createAuthObject = (libjwt: LibJWT, getUser: () => Promise<ChromeUser | void>, store: Store, globalConfig?: ChromeGlobalConfig) => ({
  getOfflineToken: () => libjwt.getOfflineToken(),
  doOffline: () =>
    libjwt.jwt.doOffline(consts.noAuthParam, consts.offlineToken, globalConfig?.chrome?.ssoUrl || globalConfig?.chrome?.config?.ssoUrl),
  getToken: () => libjwt.initPromise.then(() => libjwt.jwt.getUserInfo().then(() => libjwt.jwt.getEncodedToken())),
  getUser,
  qe: {
    ...qe,
    init: () => qe.init(store, () => libjwt),
  },
  logout: (bounce?: boolean) => libjwt.jwt.logoutAllTabs(bounce),
  login: () => libjwt.jwt.login(),
});

export const createGetUser = (libjwt: LibJWT): (() => Promise<ChromeUser | undefined | void>) => {
  return () =>
    libjwt.initPromise.then(libjwt.jwt.getUserInfo).catch(() => {
      libjwt.jwt.logoutAllTabs();
    });
};

export default ({ ssoUrl }: { ssoUrl?: string }): LibJWT => {
  console.time(TIMER_STR); // eslint-disable-line no-console
  const options = {
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
  }

  const promise = jwt.init(options, ssoUrl).then(bouncer);

  return {
    getOfflineToken: () => (isITLessEnv ? getTokenWithAuthorizationCode() : getOfflineToken(options.realm, options.clientId, ssoUrl)),
    jwt: jwt,
    initPromise: promise,
  };
};
