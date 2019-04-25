/*global module*/
/* eslint-disable camelcase */
const Keycloak = (options) => {
    let scope = 'online';
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
        scope,
        init: () => {
            return new Promise(() => true);
        },
        login: (data) => {
            scope = data.scope;
        },
        updateToken: () => {
            return new Promise(() => true);
        }
    };
};
/* eslint-enable camelcase */

module.exports = Keycloak;
