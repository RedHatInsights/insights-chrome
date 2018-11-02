// Imports
const Keycloak = require('keycloak-js');
const lodash = require('lodash');

// Utils
const log = require('./logger')('jwt.js');
const utils = require('./utils');

// Insights Specific
const insightsUrl = require('./insights/url');
const insightsUser = require('./insights/user');

const pub = {};
const priv = {};

pub.login = () => {
    log('in login');

    // Redirect to login
    priv.keycloak.login({ redirectUri: location.href });
};

pub.init = (options) => {
    log('in init');

    // TODO let users override options
    options.url = insightsUrl();

    priv.keycloak = Keycloak(options);
    return priv.keycloak.init(options);
};

pub.logout = (options) => {
    log('in logout');

    // Redirect to logout
    priv.keycloak.logout(priv.keycloak);
};

pub.getUser = () => {
    log('in getUser');
    
    return insightsUser(priv.keycloak.tokenParsed);
};

pub.userReady = () => {
    log('in userReady')
    return priv.keycloak.authenticated;
};

module.exports = pub;
utils.exposeTest(priv);
