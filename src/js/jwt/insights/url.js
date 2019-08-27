const log = require('../logger')('insights/url.js');

// Parse through keycloak options routes
module.exports = (env) => Object.entries(env)
.reduce((acc, [keys, values]) => {
    return (values.url.some(url => {
        if (url === location.hostname) {
            log(`SSO: ${values.sso}`);
            log(`ENV: ${keys}`);
            return true;
        }
    }) && values.sso) || acc;
}, 'https://sso.qa.redhat.com/auth');
