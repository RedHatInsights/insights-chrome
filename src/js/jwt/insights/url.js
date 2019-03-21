const log = require('../logger')('insights/url.js');

// Parse through keycloak options routes
module.exports = (env) => {
    // Get the environments
    const entries = Object.entries(env);
    let urlFound = false;
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
                urlFound = true;
                return (values.sso);
            }
        }

        // If the URL isn't found and is not in the default, default the user to QA
        if (!urlFound) {
            log('SSO: url not found, defaulting to QA');
            log('ENV: qa');
            return ('https://sso.qa.redhat.com/auth');
        }
    }
};
