const log = require('../logger')('insights/user.js');
const servicesApi = require('./entitlements');
const pathMapper = {
    rhel: 'smart_management',
    hybrid: 'hybrid_cloud',
    insights: 'insights',
    openshift: 'openshift'
};

function getWindow() {
    return window;
}

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

function tryBounceIfUnentitled(data, section) {
    // only test this on the apps that are in valid sections
    // we need to keep /apps and other things functional
    if (section !== 'insights' && section !== 'rhel' &&
        section !== 'openshift' && section !== 'hybrid') {
        return;
    }

    const service = pathMapper[section];

    if (section && section !== '') {
        if (data[service] && data[service].is_entitled) {
            log(`Entitled to: ${service}`);
        } else {
            log(`Not entitled to: ${service}`);
            getWindow().location.replace(`${document.baseURI}?not_entitled=${service}`);
        }
    }
}

module.exports = (token) => {
    let user = buildUser(token);

    const pathName = getWindow().location.pathname.split('/');
    pathName.shift();
    if (pathName[0] === 'beta') {
        pathName.shift();
    }

    if (user) {
        log(`Account Number: ${user.identity.account_number}`);

        // NOTE: Openshift supports Users with Account Number of -1
        // thus we need to bypass here
        // dont call entitlements on / /beta /openshift or /beta/openshift
        //
        // Landing Page *does* support accounts with -1
        // it has to
        if (getWindow().location.pathname === '/' ||
            getWindow().location.pathname === '/beta' ||
            getWindow().location.pathname === '/beta/' ||
            getWindow().location.pathname.indexOf('/openshift') === 0 ||
            getWindow().location.pathname.indexOf('/beta/openshift') === 0) {
            return new Promise(resolve => {
                user.identity = {
                    ...user.identity,
                    entitlements: {}
                };
                resolve(user);
            });
        }

        return servicesApi(token.jti).servicesGet().then(data => {
            tryBounceIfUnentitled(data, pathName[0]);

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
