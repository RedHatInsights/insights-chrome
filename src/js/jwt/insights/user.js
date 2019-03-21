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
                first_name: token.first_name,
                last_name: token.last_name,
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

    log(`User ID: ${user.identity.account_number}`);
    return user;
};
/* eslint-enable camelcase */
