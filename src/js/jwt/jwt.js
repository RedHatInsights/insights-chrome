// Imports
import Keycloak from 'keycloak-js';
import BroadcastChannel from 'broadcast-channel';

// Utils
const log = require('./logger')('jwt.js');
const utils = require('./utils');

// Insights Specific
const insightsUrl = require('./insights/url');
const insightsUser = require('./insights/user');

// Global Defaults
const DEFAULT_ROUTES = {
    prod: {
        url: ['access.redhat.com', 'prod.foo.redhat.com', 'cloud.redhat.com'],
        sso: 'https://sso.redhat.com/auth'
    },
    qa: {
        url: ['access.qa.redhat.com', 'qa.foo.redhat.com'],
        sso: 'https://sso.qa.redhat.com/auth'
    },
    ci: {
        url: ['ci.foo.redhat.com'],
        sso: 'https://sso.qa.redhat.com/auth'
    }
};

const DEFAULT_COOKIE_NAME = 'cs_jwt';
const DEFAULT_COOKIE_DOMAIN = '.redhat.com';

const pub = {};
const priv = {};

// Broadcast Channel
const authChannel = new BroadcastChannel('auth');
authChannel.onmessage = (e) => {

    log(`BroadcastChannel, Received event : ${e.data.type}`);

    switch (e.data.type) {
        case 'logout':
            pub.logout();
            break;
        case 'login':
            pub.login();
            break;
        case 'refresh':
            pub.updateToken();
            break;
    }
};

priv.decodeToken = (str) => {
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
};

/*** Initialization ***/
pub.init = (options) => {
    log('Initializing');

    const cookieName = ((options.cookieName) ? options.cookieName : DEFAULT_COOKIE_NAME);
    const cookieDomain = ((options.cookieDomain) ? options.cookieDomain : DEFAULT_COOKIE_DOMAIN);

    priv.cookie = {
        cookieName,
        cookieDomain
    };

    options.url = insightsUrl(((options.routes) ? options.routes : DEFAULT_ROUTES));
    options.promiseType = 'native';

    priv.keycloak = Keycloak(options);
    priv.keycloak.onTokenExpired = pub.updateToken;
    priv.keycloak.onAuthSuccess = pub.loginAllTabs;
    priv.keycloak.onAuthRefreshSuccess = pub.refreshTokens;

    if (options.token) {
        if (priv.isExistingValid(options.token)) {
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
    .then(pub.initSuccess)
    .catch(pub.initError);
};

priv.isExistingValid = (token) => {
    log('Checking validity of existing JWT');
    if (!token) { return false; }

    const parsed = priv.decodeToken(token);
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
};

// keycloak init successful
pub.initSuccess = () => {
    log('JWT Initialized');
    pub.setCookie(priv.keycloak.token);
    window.localStorage.setItem(priv.cookie.cookieName, priv.keycloak.refreshToken);
};

// keycloak init failed
pub.initError = () => {
    log('JWT init error');
    pub.logout();
};

/*** Login/Logout ***/
pub.login = () => {
    log('Logging in');
    // Redirect to login
    priv.keycloak.login({ redirectUri: location.href });
};

pub.logout = () => {
    log('Logging out');
    priv.keycloak.clearToken();
    // Redirect to logout
    priv.keycloak.logout(priv.keycloak);
};

pub.logoutAllTabs = () => {
    authChannel.postMessage({ type: 'logout' });
    pub.logout();
};

/*** User Functions ***/
// Get user information
pub.getUserInfo = () => {
    log('Getting User Information');

    return new Promise((res, rej) => {
        if (priv.isExistingValid(priv.keycloak.token)) {
            res(insightsUser(priv.keycloak.tokenParsed));
            return;
        }

        pub.updateToken().then(() => {
            res(insightsUser(priv.keycloak.tokenParsed));
        }).catch(() => {
            console.log('in getUser -> update token catch');
            //pub.login
        });
    });
};

// Check to see if the user is loaded, this is what API calls should wait on
pub.isAuthenticated = () => {
    log(`User Ready: ${priv.keycloak.authenticated}`);
    return priv.keycloak.authenticated;
};

/*** Check Token Status ***/
// If a token is expired, logout of all tabs
pub.expiredToken = () => { pub.logout(); };

// Broadcast message to refresh tokens across tabs
pub.refreshTokens = () => { authChannel.postMessage({ type: 'refresh' }); };

// Actually update the token
pub.updateToken = () => {
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
pub.setCookie = (token) => {
    log('Getting cookie');

    if (token && token.length > 10) {
        document.cookie = `${priv.cookie.cookieName}=${token};path=/;secure=true;domain=${priv.cookie.cookieDomain}`;
    }
};

// Encoded WIP
pub.getEncodedToken = () => {
    log('Getting encoded token');
    return (priv.keycloak.token);
};

/*** Exports ***/
module.exports = pub;
utils.exposeTest(priv);
