const log = require('../logger')('insights/user.js');
const servicesApi = require('./entitlements');
const pathMapper = {
    rhel: 'smart_management',
    hybrid: 'hybrid_cloud',
    insights: 'insights',
    openshift: 'openshift'
};

/* eslint-disable camelcase */
function buildUser(token) {
    const user = token ? {
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

    return user;
}
/* eslint-enable camelcase */

module.exports = (token) => {
    let user = buildUser(token);

    const pathName = location.pathname.split('/');
    pathName.shift();
    if (pathName[0] === 'beta') {
        pathName.shift();
    }

    if (user) {
        log(`Account Number: ${user.identity.account_number}`);

        // NOTE: Openshift supports Users with Account Number of -1
        // thus we need to bypass here
        // dont call entitlements on / /beta /openshift or /beta/openshift
        if (window.location.pathname === '/' ||
            window.location.pathname === '/beta' ||
            window.location.pathname === '/beta/' ||
            window.location.pathname.indexOf('/openshift') === 0 ||
            window.location.pathname.indexOf('/beta/openshift') === 0) {
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

            return {
                ...user,
                entitlements: data
            };
        });
    } else {
        log('User not ready');
    }

    return new Promise((res) => res());
};
