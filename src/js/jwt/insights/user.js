const log = require('../logger')('insights/user.js');

/* eslint-disable camelcase */
module.exports = (token) => {

    let user = token ? token  : null;

    log(`User ID: ${user.identity.account_number}`);

    return token;
};
/* eslint-enable camelcase */
