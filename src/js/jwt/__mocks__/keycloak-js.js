/*global module*/

const encodedToken = require('../../../../testdata/encodedToken.json').data;

/* eslint-disable camelcase */
const Keycloak = (options) => {
    let scope = 'online';
    let token = encodedToken;
    let tokenParsed = options.tokenParsed;
    let refreshToken = encodedToken;
    let redirectUri = options.redirectUri;
    return {
        callback_id: 0,
        authenticated: false,
        useNativePromise: true,
        responseMode: 'fragment',
        responseType: 'code',
        flow: 'standard',
        clientId: 'cloud-services',
        authServerUrl: 'https://sso.qa.redhat.com/auth',
        realm: 'redhat-external',
        endpoints: {},
        redirectUri,
        token,
        tokenParsed,
        refreshToken,
        scope,
        init: () => {
            return new Promise(() => true);
        },
        login: (data) => {
            scope = data.scope;
            redirectUri = data.redirectUri;
        },
        updateToken: () => {
            return new Promise(() => true);
        },
        clearToken: () => {},
        logout: () => {}
    };
};
/* eslint-enable camelcase */

module.exports = Keycloak;
