/*global require*/
const jwt = require('./jwt/jwt');
const options = {
    realm: 'redhat-external',
    clientId: 'customer-portal',
    routes: {
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
    }
};

function bouncer() {
    if (!jwt.userReady()) {
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
    console.log(promise);
    return {
        jwt: jwt,
        initPromise: promise
    };
};
