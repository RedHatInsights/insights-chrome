const log = require('../logger')('insights/user.js');

/* eslint-disable camelcase */
module.exports = (token) => {

    let user = token ? {
        identity: {
            account_number: token.account_number,
            type: token.type,
            user: {
                username: token.username,
                email: token.email,
                first_name: token.firstName,
                last_name: token.lastName,
                is_active: token.is_active,
                is_org_admin: token.is_org_admin,
                is_internal: token.is_internal,
                locale: token.lang
            },
            internal: {
                org_id: token.account_id
            }
        }
    } : null;

    if (window.testEnv === true) {
        user = {
            identity: {
                account_number: 0,
                type: 'User',
                user: {
                    username: 'test',
                    email: 'test',
                    first_name: 'test',
                    last_name: 'test',
                    is_active: false,
                    is_org_admin: false,
                    is_internal: true,
                    locale: 'test'
                },
                internal: {
                    org_id: 0
                }
            }
        };
    }

    log(`User ID: ${user.identity.account_number}`);
    return user;
};
/* eslint-enable camelcase */
