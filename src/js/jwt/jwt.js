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
authChannel.onmessage = function(e) {

    log(`BroadcastChannel, Received event : ${e.data.type}`);

    switch(e.data.type && !priv.keycloak.authenticated) {
        case 'logout':
            pub.logout();
            console.log('----------logout');
            break;
        case 'login':
            pub.login();
            console.log('----------login');
            break;
        case 'refresh':
            pub.updateToken();
            console.log('----------updateToken')
            break;
    }
}

// Init
pub.init = (options) => {
    log('Initializing');

    options.url = insightsUrl(((options.routes) ? options.routes : DEFAULT_ROUTES));

    priv.keycloak = Keycloak(options);

    priv.keycloak.onTokenExpired = pub.expiredToken;

    return priv.keycloak
        .init(options)
        .success(pub.initSuccess)
        .error(pub.initError);
};

pub.initSuccess = (authenticated) => {
    log('JWT Initialized: ' + authenticated);
};

pub.initError = (authenticated) => {
    log('JWT Initialized: ' + authenticated);
};

// Login/Logout
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

// User Functions
pub.getUser = () => {
    log('Getting User Information');
    return insightsUser(priv.keycloak.tokenParsed);
};

pub.userReady = () => {
    log(`User Ready: ${priv.keycloak.authenticated}`);
    return priv.keycloak.authenticated;
};

// Check Tokens
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
        pub.logout;
    });
};

pub.expiredToken = () => {
    pub.logout;
    authChannel.postMessage({type: 'logout'});
}

module.exports = pub;
utils.exposeTest(priv);
