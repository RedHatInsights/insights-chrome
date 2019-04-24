// Imports
import Keycloak from 'keycloak-js';
import BroadcastChannel from 'broadcast-channel';
import cookie from 'js-cookie';

// Utils
const log = require('./logger')('jwt.js');
const utils = require('./utils');

// Insights Specific
const insightsUrl  = require('./insights/url');
const insightsUser = require('./insights/user');
const urijs        = require('urijs');
const { DEFAULT_ROUTES, options: defaultOptions } = require('./constants');

// const DEFAULT_REDIRECT_URI = `${window.location}/logout`;

const DEFAULT_COOKIE_NAME = 'cs_jwt';
const DEFAULT_COOKIE_DOMAIN = '.redhat.com';

const priv = {};

// Broadcast Channel
const authChannel = new BroadcastChannel('auth');
authChannel.onmessage = (e) => {

    log(`BroadcastChannel, Received event : ${e.data.type}`);

    switch (e.data.type) {
        case 'logout':
            this.logout();
            break;
        case 'login':
            this.login();
            break;
        case 'refresh':
            this.updateToken();
            break;
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
            scope: 'offline'
        });
    });
};

/*** Initialization ***/
exports.init = (options) => {
    log('Initializing');

    const cookieName = ((options.cookieName) ? options.cookieName : DEFAULT_COOKIE_NAME);
    const cookieDomain = ((options.cookieDomain) ? options.cookieDomain : DEFAULT_COOKIE_DOMAIN);

    priv.cookie = {
        cookieName,
        cookieDomain
    };

    options.url = insightsUrl(((options.routes) ? options.routes : DEFAULT_ROUTES));
    options.promiseType = 'native';

    // TODO, add redirect back
    // options.redirectUri = ((options.redirectUri) ? options.redirectUri : DEFAULT_REDIRECT_URI);

    priv.keycloak = Keycloak(options);
    priv.keycloak.onTokenExpired = this.updateToken;
    priv.keycloak.onAuthSuccess = this.loginAllTabs;
    priv.keycloak.onAuthRefreshSuccess = this.refreshTokens;

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
    .then(this.initSuccess)
    .catch(this.initError);
};

function isExistingValid(token) {
    log('Checking validity of existing JWT');
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

    if (exp > 90) {
        priv.keycloak.tokenParsed = parsed;
        return true;
    } else {
        log('token expired');
        return false;
    }
}

// keycloak init successful
exports.initSuccess = () => {
    log('JWT Initialized');
    this.setCookie(priv.keycloak.token);
    window.localStorage.setItem(priv.cookie.cookieName, priv.keycloak.refreshToken);
};

// keycloak init failed
exports.initError = () => {
    log('JWT init error');
    this.logout();
};

/*** Login/Logout ***/
exports.login = () => {
    log('Logging in');
    // Redirect to login
    priv.keycloak.login({ redirectUri: location.href });
};

exports.logout = () => {
    log('Logging out');

    // Clear cookies and tokens
    priv.keycloak.clearToken();
    cookie.remove(priv.cookie.cookieName, { domain: priv.cookie.cookieDomain });

    // Redirect to logout
    priv.keycloak.logout(priv.keycloak);
};

exports.logoutAllTabs = () => {
    authChannel.postMessage({ type: 'logout' });
    this.logout();
};

/*** User Functions ***/
// Get user information
exports.getUserInfo = () => {
    log('Getting User Information');

    if (isExistingValid(priv.keycloak.token)) {
        return insightsUser(priv.keycloak.tokenParsed);
    }

    return this.updateToken().then(() => insightsUser(priv.keycloak.tokenParsed));
};

// Check to see if the user is loaded, this is what API calls should wait on
exports.isAuthenticated = () => {
    log(`User Ready: ${priv.keycloak.authenticated}`);
    return priv.keycloak.authenticated;
};

/*** Check Token Status ***/
// If a token is expired, logout of all tabs
exports.expiredToken = () => { exports.logout(); };

// Broadcast message to refresh tokens across tabs
exports.refreshTokens = () => { authChannel.postMessage({ type: 'refresh' }); };

// Actually update the token
exports.updateToken = () => {
    log('Trying to update token');

    return priv.keycloak.updateToken().then(function(refreshed) {
        if (refreshed) {
            log('Token was successfully refreshed');
        } else {
            log('Token is still valid');
        }
    });
};

// Set the cookie fo 3scale
exports.setCookie = (token) => {
    if (token && token.length > 10) {
        document.cookie = `${priv.cookie.cookieName}=${token};path=/;secure=true;domain=${priv.cookie.cookieDomain}`;
    }
};

// Encoded WIP
exports.getEncodedToken = () => {
    log('Getting encoded token');
    return (priv.keycloak.token);
};

// Keycloak server URL
exports.getUrl = () => {
    return insightsUrl(DEFAULT_ROUTES);
};

/*** Exports ***/
utils.exposeTest(priv);
