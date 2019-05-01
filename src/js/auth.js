/*global require*/
import { wipePostbackParamsThatAreNotForUs, getOfflineToken } from './jwt/insights/offline';
import consts from './consts';

const jwt       = require('./jwt/jwt');
const cookie    = require('js-cookie');
const TIMER_STR = '[JWT][jwt.js] Auth time';

const { options: defaultOptions } = require('./jwt/constants');

function bouncer() {
    if (allowUnauthed()) { return; }

    if (!jwt.isAuthenticated()) {
        cookie.remove(defaultOptions.cookieName);
        jwt.login();
    }

    console.timeEnd(TIMER_STR); // eslint-disable-line no-console
}

function getAllowedUnauthedPaths() {
    return consts.allowedUnauthedPaths.map(e => ([e, e + '/'])).flat();
}

export function allowUnauthed() {
    if (getAllowedUnauthedPaths().includes(window.location.pathname)) {
        window.document.querySelector('body').classList.add('unauthed');
        return true;
    }

    return false;
}

export default () => {
    console.time(TIMER_STR);  // eslint-disable-line no-console
    let options = {
        ...defaultOptions
    };

    wipePostbackParamsThatAreNotForUs();
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
        getOfflineToken: () => { return getOfflineToken(options.realm, options.clientId); },
        jwt: jwt,
        initPromise: promise
    };
};
