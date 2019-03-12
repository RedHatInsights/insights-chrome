const log = require('../logger')('insights/url.js');

// Parse through keycloak options routes
module.exports = (env) => {
    // Get the environments
    const entries = Object.entries(env);
    for (const [keys, values] of entries) {
        /* Returns:
         * Keys: Environments - prod, ci, etc
         * Values: Object with two arrays - {[[url], sso]}
         */
        for (const url of values.url) {
            // If it matches the hostname, return the sso url
            if (url === location.hostname) {
                log(`SSO: ${values.sso}`);
                log(`ENV: ${keys}`);
                return (values.sso);
            }
        }
    }
};
