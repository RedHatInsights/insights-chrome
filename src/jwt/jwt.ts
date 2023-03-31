// Imports
import Keycloak, { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';
import { BroadcastChannel } from 'broadcast-channel';
import cookie from 'js-cookie';
import { DEFAULT_SSO_ROUTES, ITLess, LOGIN_TYPE_STORAGE_KEY, deleteLocalStorageItems, pageRequiresAuthentication } from '../utils/common';
import * as Sentry from '@sentry/react';
import logger from './logger';
import { CogUser, getTokenWithAuthorizationCode, getUser } from '../cognito/auth';

// Insights Specific
import platformUrl from './url';
import platformUser from './user';
import urijs from 'urijs';
import { GLOBAL_FILTER_KEY, OFFLINE_REDIRECT_STORAGE_KEY, defaultAuthOptions as defaultOptions } from '../utils/consts';
import Priv from './Priv';
import { ChromeUser } from '@redhat-cloud-services/types';

const log = logger('jwt.js');
const DEFAULT_COOKIE_NAME = 'cs_jwt';

const priv = new Priv();
const itLessEnv = ITLess();

// Broadcast Channel
const authChannel = new BroadcastChannel('auth');
authChannel.onmessage = (e) => {
  if (e && e.data && e.data.type) {
    log(`BroadcastChannel, Received event : ${e.data.type}`);

    switch (e.data.type) {
      case 'logout':
        return logout();
      case 'login':
        return login();
      case 'refresh':
        return updateToken();
    }
  }
};

export type DecodedToken = {
  exp: number;
  session_state?: string;
};

function getPartnerScope(pathname: string) {
  // replace beta and leading "/"
  const sanitizedPathname = pathname.replace(/^\/beta\//, '/').replace(/^\//, '');
  // check if the pathname is connect/:partner
  if (sanitizedPathname.match(/^connect\/.+/)) {
    // return :partner param
    return `api.partner_link.${sanitizedPathname.split('/')[1]}`;
  }

  return undefined;
}

export function decodeToken(str: string): DecodedToken {
  str = str.split('.')[1];
  str = str.replace('/-/g', '+');
  str = str.replace('/_/g', '/');
  switch (str.length % 4) {
    case 0:
      break;
    case 2:
      str += '==';
      break;
    case 3:
      str += '=';
      break;
    default:
      throw 'Invalid token';
  }

  str = (str + '===').slice(0, str.length + (str.length % 4));
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  str = decodeURIComponent(escape(atob(str)));
  const res = JSON.parse(str);

  return res;
}

export const doOffline = (key: string, val: string, configSsoUrl?: string) => {
  // clear previous postback
  localStorage.removeItem(OFFLINE_REDIRECT_STORAGE_KEY);
  const url = urijs(window.location.href);
  url.removeSearch(key);
  url.addSearch(key, val);
  const redirectUri = url.toString();

  if (redirectUri) {
    // set new postback
    localStorage.setItem(OFFLINE_REDIRECT_STORAGE_KEY, redirectUri);
  }

  Promise.resolve(platformUrl(DEFAULT_SSO_ROUTES, configSsoUrl)).then(async (ssoUrl) => {
    const options: KeycloakInitOptions & KeycloakConfig & { promiseType: string; redirectUri: string; url: string } = {
      ...defaultOptions,
      promiseType: 'native',
      redirectUri,
      url: ssoUrl,
    };

    const kc = new Keycloak(options);

    await kc.init(options);
    const partnerScope = getPartnerScope(window.location.pathname);
    const profileScope = localStorage.getItem(LOGIN_TYPE_STORAGE_KEY);
    const scopes = ['offline_access'];
    if (partnerScope) {
      scopes.push(partnerScope);
    }

    if (profileScope) {
      // make sure add openid scope when profile scope is used
      scopes.push('openid', profileScope);
    }

    kc.login({
      scope: scopes.join(' '),
    });
  });
};

export interface JWTInitOptions extends KeycloakInitOptions {
  cookieName: string;
  routes?: typeof DEFAULT_SSO_ROUTES;
  url?: string;
  clientId: string;
  realm: string;
  promiseType?: string;
  checkLoginIframe?: boolean;
  silentCheckSsoRedirectUri?: string;
  token?: string;
}

/*** Initialization ***/
export const init = (options: JWTInitOptions, configSsoUrl?: string) => {
  log('Initializing');

  const cookieName = options.cookieName ? options.cookieName : DEFAULT_COOKIE_NAME;

  priv.setCookie({ cookieName });
  if (itLessEnv) {
    let token;
    let cogUser: CogUser;

    if (token) {
      getUser().then((res) => {
        cogUser = res;
        if (cogUser) {
          const now = Date.now().toString().substr(0, 10);
          const exp = cogUser?.exp - parseInt(now);
          if (exp < 30) {
            return getTokenWithAuthorizationCode().then((res) => {
              priv.setToken(res);
              token = res;
              return token;
            });
          }
        }
      });
    }
    return getTokenWithAuthorizationCode().then((res) => {
      priv.setToken(res);
      token = res;
      return token;
    });
  } else {
    return Promise.resolve(platformUrl(options.routes ? options.routes : DEFAULT_SSO_ROUTES, configSsoUrl)).then((ssoUrl) => {
      //constructor for new Keycloak Object?
      options.url = ssoUrl;
      options.clientId = 'cloud-services';
      options.realm = 'redhat-external';

      //options for keycloak.init method
      options.promiseType = 'native';
      options.onLoad = 'check-sso';
      options.checkLoginIframe = false;

      const isBeta = window.location.pathname.split('/')[1] === 'beta' ? '/beta' : '';

      options.silentCheckSsoRedirectUri = `https://${window.location.host}${isBeta}/apps/chrome/silent-check-sso.html`;

      if (window.localStorage && window.localStorage.getItem('chrome:jwt:shortSession') === 'true') {
        options.realm = 'short-session';
      }

      //priv.keycloak = Keycloak(options);
      priv.setKeycloak(options, updateToken, loginAllTabs, refreshTokens);

      if (options.token) {
        if (isExistingValid(options.token)) {
          // we still need to init async
          // so that the renewal times and such fire
          priv.initializeKeycloak(options);
          // Here we have an existing key
          // We need to set up some of the keycloak state
          // so that the reset of the methods that Chrome uses
          // to check if things are good get faked out
          // TODO reafctor the direct access to priv.keycloak
          // away from the users
          priv.setToken(options.token);
          return Promise.resolve();
          // return new Promise((resolve) => {

          //   resolve();
          // });
        } else {
          delete options.token;
        }
      }

      return (priv.initialize(options) as unknown as Promise<unknown>).then(initSuccess).catch(initError);
    });
  }
};

export function isExistingValid(token?: string) {
  log('Checking validity of existing JWT');
  try {
    if (!token) {
      return false;
    }

    const parsed = decodeToken(token);
    if (!parsed.exp) {
      return false;
    }

    // Date.now() has extra precision...
    // it includes milis
    // we need to trim it down to valid seconds from epoch
    // because we compare to KC's exp which is seconds from epoch
    const now = Date.now().toString().substr(0, 10);
    const exp = parsed.exp - parseInt(now);

    log(`Token expires in ${exp}`);

    // We want to invalidate tokens if they are getting close
    // to the expiry time
    // So that we can be someone safe from time skew
    // issues on our APIs
    // i.e. the client could have a slight time skew
    // and the API is true (because NTP) and we could send down
    // a JWT that is actually exipred
    if (exp > 90) {
      priv.setTokenParsed(parsed);
      return true;
    } else {
      if (exp > 0) {
        log('token is expiring in < 90 seconds');
      } else {
        log('token is expired');
      }

      return false;
    }
  } catch (e: unknown) {
    log(e);
    return false;
  }
}

// keycloak init successful
export async function initSuccess() {
  log('JWT Initialized');
  let cogToken;
  if (itLessEnv) {
    cogToken = await getTokenWithAuthorizationCode();
  }
  const token = itLessEnv ? cogToken : priv.getToken();
  setCookie(token);
}

// keycloak init failed
export function initError() {
  log('JWT init error');
  logout();
}

/*** Login/Logout ***/
export function login(fullProfile = false) {
  log('Logging in');
  // Redirect to login
  cookie.set('cs_loggedOut', 'false');
  const redirectUri = location.href;
  const loginProfile = fullProfile ? 'rhfull' : 'nameandterms';
  localStorage.setItem(LOGIN_TYPE_STORAGE_KEY, loginProfile);
  // TODO: Remove once ephemeral environment supports full and thin profile
  const scope = ['openid', ...(location.origin.includes('redhat.com') ? [loginProfile] : [])];
  const partner = getPartnerScope(window.location.pathname);
  if (partner) {
    scope.push(partner);
  }
  // KC scopes are delimited by a space character, hence the join(' ')
  return priv.login({ redirectUri, scope: scope.join(' ') });
}

export function logout(bounce?: boolean) {
  log('Logging out');
  const cookieName = priv.getCookie()?.cookieName;
  if (cookieName) {
    cookie.remove(cookieName);
  }
  cookie.remove('cs_demo');

  const isBeta = window.location.pathname.split('/')[1] === 'beta' ? '/beta' : '';
  const keys = Object.keys(localStorage).filter(
    (key) =>
      key.endsWith('/api/entitlements/v1/services') ||
      key.endsWith('/chrome') ||
      key.endsWith('/chrome-store') ||
      key.startsWith('kc-callback') ||
      key.startsWith(GLOBAL_FILTER_KEY)
  );
  deleteLocalStorageItems([...keys, LOGIN_TYPE_STORAGE_KEY]);
  // Redirect to logout
  if (bounce) {
    const eightSeconds = new Date(new Date().getTime() + 8 * 1000);
    cookie.set('cs_loggedOut', 'true', {
      expires: eightSeconds,
    });
    priv.logout({
      redirectUri: `https://${window.location.host}${isBeta}`,
    });

    // Clear cookies and tokens
    priv.clearToken();
  }
}

export const logoutAllTabs = (bounce?: boolean) => {
  authChannel.postMessage({ type: 'logout' });
  logout(bounce);
};

function loginAllTabs() {
  authChannel.postMessage({ type: 'login' });
}

/*** User Functions ***/
// Get user information
export const getUserInfo = (): Promise<ChromeUser | void | undefined> => {
  log('Getting User Information');
  const jwtCookie = cookie.get(DEFAULT_COOKIE_NAME);
  if (jwtCookie && isExistingValid(jwtCookie) && isExistingValid(priv.getToken())) {
    return platformUser(priv.getTokenParsed());
  }

  return updateToken()
    .then(() => {
      log('Successfully updated token');
      return platformUser(priv.getTokenParsed());
    })
    .catch(() => {
      if (pageRequiresAuthentication()) {
        log('Trying to log in user to refresh token');
        return login();
      }
    });
};

// Check to see if the user is loaded, this is what API calls should wait on
export const isAuthenticated = () => {
  log(`User Ready: ${priv.getAuthenticated()}`);
  return priv.getAuthenticated();
};

/*** Check Token Status ***/
// If a token is expired, logout of all tabs
export const expiredToken = () => {
  log('Token has expired, trying to log out');
  logout();
};

// Broadcast message to refresh tokens across tabs
function refreshTokens() {
  setCookie(priv.getToken());
  authChannel.postMessage({ type: 'refresh' });
}

// Actually update the token
export function updateToken() {
  return (Promise.resolve(priv?.updateToken?.()) as unknown as Promise<boolean>)
    .then((refreshed) => {
      // Important! after we update the token
      // we have to again populate the Cookie!
      // Otherwise we just update and dont send
      // the updated token down stream... and things 401
      setCookie(priv.getToken());

      log('Attempting to update token');

      if (refreshed) {
        log('Token was successfully refreshed');
      } else {
        log('Token is still valid, not updating');
      }
    })
    .catch((err) => {
      log(err);
      Sentry.captureException(err);
      log('Token updated failed, trying to reauth');
      login();
    });
}

export function getCookieExpires(exp: number) {
  // we want the cookie to expire at the same time as the JWT session
  // so we take the exp and get a new GTMString from that
  const date = new Date(0);
  date.setUTCSeconds(exp);
  return date.toUTCString();
}

// Set the cookie for 3scale
export async function setCookie(token?: string) {
  log('Setting the cs_jwt cookie');
  let cogToken;
  let cogUser;
  if (itLessEnv) {
    cogToken = await getTokenWithAuthorizationCode();
    cogUser = await getUser();
  }
  const tok = itLessEnv ? cogToken : token;
  const tokExpires = itLessEnv ? cogUser.exp : decodeToken(tok).exp;
  if (tok && tok.length > 10) {
    const cookieName = priv.getCookie()?.cookieName;
    if (cookieName) {
      setCookieWrapper(`${cookieName}=${tok};` + `path=/wss;` + `secure=true;` + `expires=${getCookieExpires(tokExpires)}`);
      setCookieWrapper(`${cookieName}=${tok};` + `path=/ws;` + `secure=true;` + `expires=${getCookieExpires(tokExpires)}`);
      setCookieWrapper(`${cookieName}=${tok};` + `path=/api/tasks/v1;` + `secure=true;` + `expires=${getCookieExpires(tokExpires)}`);
      setCookieWrapper(`${cookieName}=${tok};` + `path=/api/automation-hub;` + `secure=true;` + `expires=${getCookieExpires(decodeToken(tok).exp)}`);
      setCookieWrapper(`${cookieName}=${tok};` + `path=/api/remediations/v1;` + `secure=true;` + `expires=${getCookieExpires(tokExpires)}`);
      setCookieWrapper(`${cookieName}=${tok};` + `path=/api/edge/v1;` + `secure=true;` + `expires=${getCookieExpires(tokExpires)}`);
    }
  }
}

// do this so we can mock out for test
export function setCookieWrapper(str: string) {
  window.document.cookie = str;
}

// Encoded WIP
export const getEncodedToken = () => {
  log('Trying to get the encoded token');

  if (!isExistingValid(priv.getToken())) {
    log('Failed to get encoded token, trying to update');
    updateToken();
  }

  return priv.getToken();
};

// Keycloak server URL
export const getUrl = (ssoUrl?: string) => {
  return platformUrl(DEFAULT_SSO_ROUTES, ssoUrl);
};
