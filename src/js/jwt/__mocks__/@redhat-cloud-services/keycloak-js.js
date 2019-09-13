/*global module*/
import cookie from 'js-cookie';
const encodedToken = require('../../../../../testdata/encodedToken.json').data;

/* eslint-disable camelcase */
const Keycloak = (options) => {
    let scope = options.scope || 'online';
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
            return new Promise(() => {});
        },
        login: (data) => {
            redirectUri = data.redirectUri;
            cookie.set('cs_jwt', 'token1');
        },
        updateToken: () => {
            return new Promise(() => {
                cookie.remove('cs_jwt');
                cookie.set('cs_jwt', 'updatedToken');
                return true;
            });
        },
        clearToken: () => {
            cookie.remove('cs_jwt');
        },
        logout: () => {
            cookie.remove('cs_jwt');
        }
    };
};
/* eslint-enable camelcase */

module.exports = Keycloak;
