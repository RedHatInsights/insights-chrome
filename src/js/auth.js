/*global require*/
import { wipePostbackParamsThatAreNotForUs, getOfflineToken } from './jwt/insights/offline';

const jwt       = require('./jwt/jwt');
const cookie    = require('js-cookie');
const JWT_KEY   = 'cs_jwt';
const TIMER_STR = '[JWT][jwt.js] Auth time';

const options = {
    realm: 'redhat-external',
    clientId: 'cloud-services'
};

function bouncer() {
    if (!jwt.isAuthenticated()) {
        cookie.remove(JWT_KEY);
        jwt.login();
    }

    console.timeEnd(TIMER_STR); // eslint-disable-line no-console
}

export default () => {
    console.time(TIMER_STR);  // eslint-disable-line no-console
    wipePostbackParamsThatAreNotForUs();
    const token = cookie.get(JWT_KEY);

    // If we find an existing token, use it
    // so that we dont auth even when a valid token is present
    // otherwise its quick, but we bounce around and get a new token
    // on every page load
    if (token && token.length > 10) {
        options.token = token;
        options.refreshToken = window.localStorage.getItem(JWT_KEY);
    }

    const promise = jwt.init(options).then(bouncer);

    return {
        getOfflineToken: () => { return getOfflineToken(options.realm, options.clientId); },
        jwt: jwt,
        initPromise: promise
    };
};
