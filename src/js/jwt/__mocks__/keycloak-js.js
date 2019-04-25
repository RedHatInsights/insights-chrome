/*global module*/
/* eslint-disable camelcase */
const Keycloak = (options) => {
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
        init: () => {
            return new Promise(() => console.log('Called mock init'));
        }
    };
};
/* eslint-enable camelcase */

module.exports = Keycloak;
