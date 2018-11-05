const log = require('../logger')('insights/url.js');

// Parse through keycloak options routes
module.exports = (env) => {
    // Get the environments
    const entries = Object.entries(env);
    for (const [keys, values] of entries) {
        // Returns: envirnment and object containing urls and sso path
        // Iterate through single object with urls + sso
        for (const urls of values.url) {
            // If it matches the hostname, return the sso url
            if (urls === location.hostname) {
                log(`SSO: ${values.sso}`);
                log(`ENV: ${keys}`);
                return (values.sso);
            }
        }
    }
};
