/*global require*/
const jwt = require('./jwt/jwt');
const options = {
    realm: 'redhat-external',
    clientId: 'customer-portal'
};

function bouncer() {
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
    const promise = jwt.init(options).then(bouncer);
    return {
        jwt: jwt,
        initPromise: promise
    };
};
