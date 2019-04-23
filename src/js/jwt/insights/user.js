const log = require('../logger')('insights/user.js');
const servicesApi = require('./entitlements');
const pathMapper = {
    rhel: 'smart_management',
    hybrid: 'hybrid_cloud',
    insights: 'insights',
    openshift: 'openshift'
};

/* eslint-disable camelcase */
module.exports = (token) => {

    let user = token ? {
        identity: {
            account_number: token.account_number,
            type: token.type,
            user: {
                username: token.username,
                email: token.email,
                first_name: token.first_name,
                last_name: token.last_name,
                is_active: token.is_active,
                is_org_admin: token.is_org_admin,
                is_internal: token.is_internal,
                locale: token.locale
            },
            internal: {
                org_id: token.org_id,
                account_id: token.account_id
            }
        }
    } : null;

    const pathName = location.pathname.split('/');
    pathName.shift();
    if (pathName[0] === 'beta') {
        pathName.shift();
    }

    if (user) {
        log(`Account Number: ${user.identity.account_number}`);

        // Disable this feature in prod
        // otherwise we get errors and things spin

        // Disable qa becuase the service has not shipped yet
        if (window.location.hostname === 'cloud.redhat.com' ||
            window.location.hostname.indexOf('qa') === 0) {
            return new Promise(resolve => {
                user.identity = {
                    ...user.identity,
                    entitlements: {}
                };
                resolve(user);
            });
        }

        return servicesApi(token.jti).servicesGet().then(data => {
            const service = pathMapper[pathName[0]];
            if (pathName.length > 0 && pathName[0] !== '') {
                if (data[service] && data[service].is_entitled) {
                    log('Entitled.');
                } else {
                    log('Not entitled!');
                    if (document.baseURI.indexOf('ci') === -1 && document.baseURI.indexOf('qa') === -1) {
                        location.replace(`${document.baseURI}?not_entitled=${service}`);
                    }
                }
            }

            user.identity = {
                ...user.identity,
                entitlements: data
            };
            return user;
        });
    } else {
        log('User not ready');
    }

    return new Promise((res) => res());
};
/* eslint-enable camelcase */
