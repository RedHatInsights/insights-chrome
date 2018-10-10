/*global require*/
const jwt = require('jwt-redhat').default;

function initCallback() {
    if (!jwt.isAuthenticated()) {
        const keys = [
            'jwt-redhat-lf/refresh_fail_count',
            'rh_jwt',
            'rh_refresh_token'
        ];

        for (const key of keys) {
            window.localStorage.removeItem(key);
        }

        jwt.login();
    }
}


export default () => {
    jwt.onInit(initCallback);
    jwt.init({
        keycloakOptions: { clientId: 'customer-portal' },
        keycloakInitOptions: { responseMode: 'query' }
    });
}
