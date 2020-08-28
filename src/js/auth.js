import { wipePostbackParamsThatAreNotForUs, getOfflineToken } from './jwt/insights/offline';
import consts from './consts';

// Started off using Array.flat
// Edge lacks this and every version of IE
// Use lodash instead
import flatten from 'lodash/flatten';

import * as jwt from './jwt/jwt';
import cookie from 'js-cookie';
import { options as defaultOptions } from './jwt/constants';
const TIMER_STR = '[JWT][jwt.js] Auth time';

function getWindow() {
    return window;
}

function bouncer() {
    if (allowUnauthed()) { return; }

    if (!jwt.isAuthenticated()) {
        cookie.remove(defaultOptions.cookieName);
        jwt.login();
    }

    console.timeEnd(TIMER_STR); // eslint-disable-line no-console
}

function getAllowedUnauthedPaths() {
    return flatten(consts.allowedUnauthedPaths.map(e => ([e, e + '/'])));
}

export function allowUnauthed() {
    if (getAllowedUnauthedPaths().includes(getWindow().location.pathname)) {
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
        options.refreshToken = getWindow().localStorage.getItem(options.cookieName);
    }

    const promise = jwt.init(options).then(bouncer);

    return {
        getOfflineToken: () => { return getOfflineToken(options.realm, options.clientId); },
        jwt: jwt,
        initPromise: promise
    };
};
