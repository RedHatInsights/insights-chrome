/*global require*/
const jwt       = require('./jwt/jwt');
const cookie    = require('js-cookie');
const TIMER_STR = '[JWT][jwt.js] Auth time';

const options = {
    realm: 'redhat-external',
    clientId: 'cloud-services',
    cookieName: 'cs_jwt',
    cookieDomain: '.redhat.com'
};

function bouncer() {
    if (!jwt.isAuthenticated()) {
        cookie.remove(options.cookieName, { domain: options.cookieDomain });
        jwt.login();
    }

    console.timeEnd(TIMER_STR); // eslint-disable-line no-console
}

export default () => {
    console.time(TIMER_STR);  // eslint-disable-line no-console
    const token = cookie.get(options.cookieName);

    // If we find an existing token, use it
    // so that we dont auth even when a valid token is present
    // otherwise its quick, but we bounce around and get a new token
    // on every page load
    if (token && token.length > 10) {
        options.token = token;
        options.refreshToken = window.localStorage.getItem(options.cookieName);
    }

    const promise = jwt.init(options).then(bouncer);

    return {
        jwt: jwt,
        initPromise: promise
    };
};
