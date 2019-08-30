/*global exports, require*/

// Imports
import Keycloak from 'keycloak-js';
import BroadcastChannel from 'broadcast-channel';
import cookie from 'js-cookie';
import { pageRequiresAuthentication } from '../utils';
import * as Sentry from '@sentry/browser';

// Utils
const log = require('./logger')('jwt.js');

// Insights Specific
const insightsUrl  = require('./insights/url');
const insightsUser = require('./insights/user');
const urijs        = require('urijs');
const { DEFAULT_ROUTES, options: defaultOptions } = require('./constants');

const DEFAULT_COOKIE_NAME = 'cs_jwt';

const priv = {};

// Broadcast Channel
const authChannel = new BroadcastChannel('auth');
authChannel.onmessage = (e) => {
    if (e && e.data && e.data.type) {
        log(`BroadcastChannel, Received event : ${e.data.type}`);

        switch (e.data.type) {
            case 'logout':
                logout();
                break;
            case 'login':
                exports.login();
                break;
            case 'refresh':
                updateToken();
                break;
        }
    }
};

function decodeToken (str) {
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

exports.doOffline = (key, val) => {
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
exports.init = (options) => {
    log('Initializing');

    const cookieName = ((options.cookieName) ? options.cookieName : DEFAULT_COOKIE_NAME);

    priv.cookie = {
        cookieName
    };

    options.url = insightsUrl(((options.routes) ? options.routes : DEFAULT_ROUTES));
    options.promiseType = 'native';

    if (window.localStorage && window.localStorage.getItem('chrome:jwt:shortSession') === 'true') {
        options.realm = 'short-session';
    }

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

        log(`expires in ${exp}`);

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
        } else {
            log('token expired');
            return false;
        }
    } catch (e) {
        return false;
    }
}

// keycloak init successful
function initSuccess() {
    log('JWT Initialized');
    setCookie(priv.keycloak.token);
    window.localStorage.setItem(priv.cookie.cookieName, priv.keycloak.refreshToken);
}

// keycloak init failed
function initError() {
    log('JWT init error');
    logout();
}

/*** Login/Logout ***/
exports.login = () => {
    log('Logging in');
    // Redirect to login
    return priv.keycloak.login({ redirectUri: location.href });
};

// eslint-disable-next-line no-unused-vars
function login() {
    return priv.keycloak.login({ redirectUri: location.href });
}

exports.checkKeycloakToken = () =>{
    log('checking keycloak token');
    let ifrm = document.createElement('iframe');
    ifrm.setAttribute('srcDoc', '<script type="text/javascript">' + login() + '</script>');
    ifrm.setAttribute('title', 'keycloak-silent-check-sso');
    //ifrm.style.display = 'none';
    ifrm.style.backgroundColor = 'red';
    document.body.appendChild(ifrm);

};

function logout(bounce) {
    log('Logging out');

    // Clear cookies and tokens
    priv.keycloak.clearToken();
    cookie.remove(priv.cookie.cookieName);

    // Redirect to logout
    if (bounce) {
        alert('asjf;dskjafds');
        priv.keycloak.logout({
            //redirectUri: `https://${window.location.host}`
            redirectUri: `${location.href}`
        });
    }
}

exports.logoutAllTabs = (bounce) => {
    authChannel.postMessage({ type: 'logout' });
    logout(bounce);
};

function loginAllTabs() {
    authChannel.postMessage({ type: 'login' });
}

/*** User Functions ***/
// Get user information
exports.getUserInfo = () => {
    log('Getting User Information');
    const jwtCookie = cookie.get(DEFAULT_COOKIE_NAME);

    if (jwtCookie && isExistingValid(jwtCookie) && isExistingValid(priv.keycloak.token)) {
        return insightsUser(priv.keycloak.tokenParsed);
    }

    return updateToken()
    .then(() => {
        insightsUser(priv.keycloak.tokenParsed);
    })
    .catch(() => {
        if (pageRequiresAuthentication()) {
            return exports.login();
        }
    });
};

// Challenge auth and login if the user could be logged in, but in an unauth state
exports.checkAuth = () => {
    log('Checking Auth');
    return priv.keycloak.authenticated;
};

// Check to see if the user is loaded, this is what API calls should wait on
exports.isAuthenticated = () => {
    log(`User Ready: ${priv.keycloak.authenticated}`);
    return priv.keycloak.authenticated;
};

/*** Check Token Status ***/
// If a token is expired, logout of all tabs
exports.expiredToken = () => { logout(); };

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

        if (refreshed) {
            log('Token was successfully refreshed');
        } else {
            log('Token is still valid');
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
    if (token && token.length > 10) {
        setCookieWrapper(`${priv.cookie.cookieName}=${token};` +
                         `path=/;` +
                         `secure=true;` +
                         `expires=${getCookieExpires(decodeToken(token).exp)}`);
    }
}

// do this so we can mock out for test
function setCookieWrapper(str) {
    document.cookie = str;
}

// Encoded WIP
exports.getEncodedToken = () => {
    log('Getting encoded token');

    if (!isExistingValid(priv.keycloak.token)) {
        Sentry.captureException(new Error('Fetching token failed - expired token'));
    }

    return (priv.keycloak.token);
};

// Keycloak server URL
exports.getUrl = () => {
    return insightsUrl(DEFAULT_ROUTES);
};
