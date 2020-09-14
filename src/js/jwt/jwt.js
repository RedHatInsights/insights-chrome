// Imports
import Keycloak from '@redhat-cloud-services/keycloak-js';
import { BroadcastChannel } from 'broadcast-channel';
import cookie from 'js-cookie';
import { pageRequiresAuthentication } from '../utils';
import * as Sentry from '@sentry/browser';
import { GLOBAL_FILTER_KEY } from '../App/GlobalFilter/constants';
import { deleteLocalStorageItems } from '../utils';
import logger from './logger';

// Insights Specific
import insightsUrl  from './insights/url';
import insightsUser from './insights/user';
import urijs from 'urijs';
import { DEFAULT_ROUTES, options as defaultOptions } from './constants';

const log = logger('jwt.js');
const DEFAULT_COOKIE_NAME = 'cs_jwt';

const priv = {};

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

export function decodeToken (str) {
    str = str.split('.')[1];
    str = str.replace('/-/g', '+');
    str = str.replace('/_/g', '/');
    switch (str.length % 4)
    {
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
    str = JSON.parse(str);

    return str;
}

export const doOffline = (key, val) => {
    const url = urijs(window.location.href);
    url.removeSearch(key);
    url.addSearch(key, val);

    const options = {
        ...defaultOptions,
        promiseType: 'native',
        redirectUri: url.toString(),
        url: insightsUrl(DEFAULT_ROUTES)
    };

    const kc = Keycloak(options);
    kc.init(options).then(() => {
        kc.login({
            scope: 'offline_access'
        });
    });
};

/*** Initialization ***/
export const init = (options) => {
    log('Initializing');

    const cookieName = ((options.cookieName) ? options.cookieName : DEFAULT_COOKIE_NAME);

    priv.cookie = {
        cookieName
    };
    //constructor for new Keycloak Object?
    options.url = insightsUrl(((options.routes) ? options.routes : DEFAULT_ROUTES));
    options.clientId = 'cloud-services';
    options.realm = 'redhat-external';

    //options for keycloak.init method
    options.promiseType = 'native';
    options.onLoad = 'check-sso';
    options.checkLoginIframe = false;

    const isBeta = (window.location.pathname.split('/')[1] === 'beta' ? '/beta' : '');

    options.silentCheckSsoRedirectUri = `https://${window.location.host}${isBeta}/silent-check-sso.html`;

    if (window.localStorage && window.localStorage.getItem('chrome:jwt:shortSession') === 'true') {
        options.realm = 'short-session';
    }

    //priv.keycloak = Keycloak(options);
    priv.keycloak = Keycloak(options);
    priv.keycloak.onTokenExpired = updateToken;
    priv.keycloak.onAuthSuccess = loginAllTabs;
    priv.keycloak.onAuthRefreshSuccess = refreshTokens;

    if (options.token) {
        if (isExistingValid(options.token)) {
            // we still need to init async
            // so that the renewal times and such fire
            priv.keycloak.init(options);

            return new Promise((resolve) => {
                // Here we have an existing key
                // We need to set up some of the keycloak state
                // so that the reset of the methods that Chrome uses
                // to check if things are good get faked out
                // TODO reafctor the direct access to priv.keycloak
                // away from the users
                priv.keycloak.authenticated = true;
                priv.keycloak.token = options.token;
                resolve();
            });
        } else {
            delete options.token;
        }
    }

    return priv.keycloak
    .init(options)
    .then(initSuccess)
    .catch(initError);
};

function isExistingValid(token) {
    log('Checking validity of existing JWT');
    try {
        if (!token) { return false; }

        const parsed = decodeToken(token);
        if (!parsed.exp) { return false; }

        // Date.now() has extra precision...
        // it includes milis
        // we need to trim it down to valid seconds from epoch
        // because we compare to KC's exp which is seconds from epoch
        const now = Date.now().toString().substr(0, 10);
        const exp = parsed.exp - now;

        log(`Token expires in ${exp}`);

        // We want to invalidate tokens if they are getting close
        // to the expiry time
        // So that we can be someone safe from time skew
        // issues on our APIs
        // i.e. the client could have a slight time skew
        // and the API is true (because NTP) and we could send down
        // a JWT that is actually exipred
        if (exp > 90) {
            priv.keycloak.tokenParsed = parsed;
            return true;
        }
        else {
            if (exp > 0) {
                log('token is expiring in < 90 seconds');
            } else {
                log('token is expired');
            }

            return false;
        }
    } catch (e) {
        log(e);
        return false;
    }
}

// keycloak init successful
function initSuccess() {
    log('JWT Initialized');
    setCookie(priv.keycloak.token);
    setRefresh(priv.keycloak.refreshToken);
}

// keycloak init failed
function initError() {
    log('JWT init error');
    logout();
}

/*** Login/Logout ***/
export function login () {
    log('Logging in');
    // Redirect to login
    cookie.set('cs_loggedOut', 'false');
    return priv.keycloak.login({ redirectUri: location.href });
}

function logout(bounce) {
    log('Logging out');

    // Clear cookies and tokens
    priv.keycloak.clearToken();
    cookie.remove(priv.cookie.cookieName);

    const isBeta = (window.location.pathname.split('/')[1] === 'beta' ? '/beta' : '');
    const keys = Object.keys(localStorage).filter(key => (
        key.endsWith('/api/entitlements/v1/services') ||
        key.endsWith('/config/main.yml') ||
        key.startsWith('kc-callback') ||
        key.startsWith(GLOBAL_FILTER_KEY)
    ));
    deleteLocalStorageItems(keys);
    // Redirect to logout
    if (bounce) {
        let eightSeconds = new Date(new Date().getTime() + 8 * 1000);
        cookie.set('cs_loggedOut', 'true', {
            expires: eightSeconds
        });
        priv.keycloak.logout({
            redirectUri: `https://${window.location.host}${isBeta}`
        });
    }
}

export const logoutAllTabs = (bounce) => {
    authChannel.postMessage({ type: 'logout' });
    logout(bounce);
};

function loginAllTabs() {
    authChannel.postMessage({ type: 'login' });
}

/*** User Functions ***/
// Get user information
export const getUserInfo = () => {
    log('Getting User Information');
    const jwtCookie = cookie.get(DEFAULT_COOKIE_NAME);

    if (jwtCookie && isExistingValid(jwtCookie) && isExistingValid(priv.keycloak.token)) {
        return insightsUser(priv.keycloak.tokenParsed);
    }

    return updateToken()
    .then(() => {
        insightsUser(priv.keycloak.tokenParsed);
        log('Successfully updated token');
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
    log(`User Ready: ${priv.keycloak.authenticated}`);
    return priv.keycloak.authenticated;
};

/*** Check Token Status ***/
// If a token is expired, logout of all tabs
export const expiredToken = () => {
    log('Token has expired, trying to log out');
    logout();
};

// Broadcast message to refresh tokens across tabs
function refreshTokens() {
    authChannel.postMessage({ type: 'refresh' });
}

// Actually update the token
function updateToken() {
    return priv.keycloak.updateToken().then(refreshed => {
        // Important! after we update the token
        // we have to again populate the Cookie!
        // Otherwise we just update and dont send
        // the updated token down stream... and things 401
        setCookie(priv.keycloak.token);

        log('Attempting to update token');

        if (refreshed) {
            log('Token was successfully refreshed');
        } else {
            log('Token is still valid, not updating');
        }
    });
}

function getCookieExpires(exp) {
    // we want the cookie to expire at the same time as the JWT session
    // so we take the exp and get a new GTMString from that
    const date = new Date(0);
    date.setUTCSeconds(exp);
    return date.toGMTString();
}

// Set the cookie for 3scale
function setCookie(token) {
    log('Setting the cs_jwt cookie');
    if (token && token.length > 10) {
        setCookieWrapper(`${priv.cookie.cookieName}=${token};` +
                         `path=/;` +
                         `secure=true;` +
                         `expires=${getCookieExpires(decodeToken(token).exp)}`);
    }
}

function setRefresh(refreshToken) {
    log('Setting the refresh token');
    cookie.set('cs_jwt_refresh', refreshToken, { secure: true });
}

// do this so we can mock out for test
function setCookieWrapper(str) {
    document.cookie = str;
}

// Encoded WIP
export const getEncodedToken = () => {
    log('Trying to get the encoded token');

    if (!isExistingValid(priv.keycloak.token)) {
        Sentry.captureException(new Error('Fetching token failed - expired token'));
        log('Failed to get encoded token');
        updateToken();
    }

    return (priv.keycloak.token);
};

// Keycloak server URL
export const getUrl = () => {
    return insightsUrl(DEFAULT_ROUTES);
};
