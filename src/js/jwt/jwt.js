// Imports
const Keycloak = require('keycloak-js');

// Utils
const log = require('./logger')('jwt.js');
const utils = require('./utils');

// Insights Specific
const insightsUrl = require('./insights/url');
const insightsUser = require('./insights/user');

// Global Defaults
const DEFAULT_ROUTES = {
    prod: {
        url: ['access.redhat.com', 'prod.foo.redhat.com'],
        sso: 'https://sso.redhat.com/auth'
    },
    qa: {
        url: ['access.qa.redhat.com', 'access.qa.itop.redhat.com', 'qa.foo.redhat.com'],
        sso: 'https://sso.qa.redhat.com/auth'
    },
    ci: {
        url: ['access.ci.itop.redhat.com'],
        sso: 'https://sso.qa.redhat.com/auth'
    }
};

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

    priv.keycloak = Keycloak(options);

    priv.keycloak.onTokenExpired = pub.updateToken;
    priv.keycloak.onAuthSuccess = pub.loginAllTabs;
    priv.keycloak.onAuthRefreshSuccess = pub.refreshTokens;

    return priv.keycloak
    .init(options)
    .success(pub.initSuccess)
    .error(pub.initError);
};

// keycloak init successful
pub.initSuccess = () => { log('JWT Initialized'); };

// keycloak init failed
pub.initError = () => {
    log('init error');
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
    pub.logout;
};

/*** User Functions ***/
// Get user information
pub.getUser = () => {
    log('Getting User Information');
    return insightsUser(priv.keycloak.tokenParsed);
};

// Check to see if the user is loaded, this is what API calls should wait on
pub.userReady = () => {
    log(`User Ready: ${priv.keycloak.authenticated}`);
    return priv.keycloak.authenticated;
};

/*** Check Token Status ***/
// If a token is expired, logout of all tabs
pub.expiredToken = () => { pub.logout; };

// Broadcast message to refresh tokens across tabs
pub.refreshTokens = () => { authChannel.postMessage({ type: 'refresh' }); };

// Actually update the token
pub.updateToken = () => {
    log('Trying to update token');
    priv.keycloak.updateToken(5).success(function(refreshed) {
        if (refreshed) {
            log('Token was successfully refreshed');
        } else {
            log('Token is still valid');
        }
    }).error(function() {
        log('Failed to refresh the token, or the session has expired');
        pub.logoutAllTabs;
    });
};

/*** Exports ***/
module.exports = pub;
utils.exposeTest(priv);
