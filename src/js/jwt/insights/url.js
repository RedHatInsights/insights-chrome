const log = require('../logger')('insights/url.js');

// Parse through keycloak options routes
module.exports = (env) => Object.entries(env)
.reduce((acc, [keys, values]) => {
    const urlFound = values.url.some(url => url === location.hostname);
    if (urlFound) {
        log(`SSO: ${values.sso}`);
        log(`ENV: ${keys}`);
        return values.sso;
    } else {
        log('SSO: url not found, defaulting to QA');
        log('ENV: qa');
        return acc;
    }
}, 'https://sso.qa.redhat.com/auth');
