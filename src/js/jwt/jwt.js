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

/*** Initialization ***/
pub.init = (options) => {
    log('Initializing');

    options.url = insightsUrl(((options.routes) ? options.routes : DEFAULT_ROUTES));
    options.promiseType = 'native';

    priv.keycloak = Keycloak(options);

    const cookieName = ((options.cookieName) ? options.cookieName : DEFAULT_COOKIE_NAME);
    const cookieDomain = ((options.cookieDomain) ? options.cookieDomain : DEFAULT_COOKIE_DOMAIN);
    priv.cookie = {
        cookieName,
        cookieDomain
    };

    priv.keycloak.onTokenExpired = pub.updateToken;
    priv.keycloak.onAuthSuccess = pub.loginAllTabs;
    priv.keycloak.onAuthRefreshSuccess = pub.refreshTokens;

    return priv.keycloak
    .init(options)
    .then(pub.initSuccess)
    .catch(pub.initError);
};

// keycloak init successful
pub.initSuccess = () => {
    log('JWT Initialized');
    pub.getCookie(priv.keycloak.token);
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
    return insightsUser(priv.keycloak.tokenParsed);
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
    priv.keycloak.updateToken().then(function(refreshed) {
        if (refreshed) {
            log('Token was successfully refreshed');
        } else {
            log('Token is still valid');
        }
    }).catch(function() {
        log('Failed to refresh the token, or the session has expired');
        pub.logoutAllTabs();
    });
};

// Set the cookie fo 3scale
pub.getCookie = (token) => {
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
