const Keycloak = require('keycloak-js');
const lodash = require('lodash');

import '@babel/polyfill';

import CacheUtils from './cacheUtils';

const Jwt = {
    login: initialized(login),
    logout: initialized(logout),
    isAuthenticated: initialized(isAuthenticated),
    getUserInfo: initialized(getUserInfo),
    onInit: onInit,
    reinit: reinit,
    init: init
};

export default Jwt;

/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global JSON, console, document, window */
/*jslint browser: true*/

const privateFunctions = {
    /**
     * Store things in local- or sessionStorage.  Because *Storage only
     * accepts string values, the store will automatically serialize
     * objects into JSON strings when you store them (set), and deserialize
     * them back into objects when you retrieve them (get).
     *
     * @param {string} type Either "local" or "session", depending on
     * whether you want localStorage or sessionStorage.
     * @return {object} An object-friendly interface to localStorage or
     * sessionStorage.
     */
    makeStore: function (type) {
        let store;
        try {
            // if DOM Storage is disabled in Chrome, merely referencing
            // window.localStorage or window.sessionStorage will throw a
            // DOMException.
            store = window[type + 'Storage'];

        } catch (e) {
            // if DOM Storage is disabled in other browsers, it may not
            // throw an error, but we should still throw one for them.
            throw new Error('DOM Storage is disabled');
        }

        // The get and set here are used exclusively for getting and setting the token and refreshToken which are strings.
        return {
            get: function(key) {
                const value = store.getItem(key);
                return value && JSON.parse(value);
            },
            set: function(key, val) {
                if (typeof val !== 'undefined') {
                    return store.setItem(key, JSON.stringify(val));
                }
            },
            remove: function(key) {
                return store.removeItem(key);
            }
        };
    }
};

const lib = {

    /**
     * A simple function to get the value of a given cookie
     * @param {string} cookieName The cookie name/key
     * @returns {string} The string value of the cookie, "" if there was no cookie
     */
    getCookieValue: function(cookieName) {
        let start; let end;
        if (document.cookie.length > 0) {
            start = document.cookie.indexOf(cookieName + '=');
            if (start !== -1 && (start === 0 || (document.cookie.charAt(start - 1) === ' '))) {
                start += cookieName.length + 1;
                end = document.cookie.indexOf(';', start);
                if (end === -1) { end = document.cookie.length; }

                return decodeURI(document.cookie.substring(start, end));
            }
        }

        return '';
    },
    setCookie: function (name, value, expires, path, domain, secure) {
        // set time, it's in milliseconds
        const today = new Date();
        today.setTime(today.getTime());

        /*
        if the expires variable is set, make the correct
        expires time, the current script below will set
        it for x number of days, to make it for hours,
        delete * 24, for minutes, delete * 60 * 24
        */
        if (expires) {
            expires = expires * 1000 * 60 * 60;
        }

        const expiresDate = new Date(today.getTime() + (expires));

        document.cookie = name + '=' + encodeURI(value) +
            ((expires) ? ';expires=' + expiresDate.toUTCString() : '') +
            ((path) ? ';path=' + path : '') +
            ((domain) ? ';domain=' + domain : '') +
            ((secure) ? ';secure' : '');
    },
    removeCookie: function(cookieName) {
        const cookieDate = new Date();  // current date & time
        cookieDate.setTime(cookieDate.getTime() - 1);
        document.cookie = cookieName += '=; expires=' + cookieDate.toUTCString();
    },
    store: {
        local: privateFunctions.makeStore('local'),
        session: privateFunctions.makeStore('session')
    }
};

const DEFAULT_KEYCLOAK_OPTIONS = {
    realm: 'redhat-external',
    clientId: 'changeme'
};

const JWT_REDHAT_IDENTIFIER = 'jwt_redhat';
const TOKEN_SURFIX = `_${JWT_REDHAT_IDENTIFIER}_token`;
const REFRESH_TOKEN_NAME_SURFIX = `_${JWT_REDHAT_IDENTIFIER}_refresh_token`;
const FAIL_COUNT_NAME_SURFIX = `_${JWT_REDHAT_IDENTIFIER}_refresh_fail_count`;

let TOKEN_NAME = `${DEFAULT_KEYCLOAK_OPTIONS.clientId}${TOKEN_SURFIX}`;
let INITIAL_JWT_OPTIONS = undefined;
let COOKIE_TOKEN_NAME = TOKEN_NAME;
let REFRESH_TOKEN_NAME = `${DEFAULT_KEYCLOAK_OPTIONS.clientId}${REFRESH_TOKEN_NAME_SURFIX}`;
let FAIL_COUNT_NAME = `${DEFAULT_KEYCLOAK_OPTIONS.clientId}${FAIL_COUNT_NAME_SURFIX}`;

const TOKEN_EXP_TTE = 58; // Seconds to check forward if the token will expire
const REFRESH_INTERVAL = 1 * TOKEN_EXP_TTE * 1000; // ms. check token for upcoming expiration every this many milliseconds
const REFRESH_TTE = 90; // seconds. refresh only token if it would expire this many seconds from now
const FAIL_COUNT_THRESHOLD = 5; // how many times in a row token refresh can fail before we give up trying
let disablePolling = false;
let initialUserToken = null;

// This is explicitly to track when the first successfull updateToken happens.
let timeSkew = null;

const DEFAULT_KEYCLOAK_INIT_OPTIONS = {
    responseMode: 'query', // was previously fragment and doesn't work with fragment.
    flow: 'standard',
    token: null,
    refreshToken: null
};

const origin = location.hostname;
// const originWithPort = location.hostname + (location.port ? ':' + location.port : '');

let token = null;
let refreshToken = null;

const state = {
    initialized: false,
    keycloak: null
};

const events = {
    init: [],
    token: [],
    tokenMismatch: [],
    jwtTokenUpdateFailed: [],
    refreshError: [],
    refreshSuccess: [],
    logout: [],
    tokenExpired: [],
    initError: []
};

/**
 * Log session-related messages to the console, in pre-prod environments.
 */
function log() {
    const args = arguments;
    try {
        CacheUtils.get('debug-logging').then((debugLoggingCache) => {
            if (debugLoggingCache && debugLoggingCache.value === true) {
                console.log.apply(console, args);
            }
        });
    } catch (e) {
        // empty
    }
}

// Keep track of the setInterval for the refresh token so we can cancel it and restart it if need be
let refreshIntervalId;
/**
 * Kicks off all the session-related things again.
 *
 * @memberof module:jwt
 * @private
 */
function reinit() {
    log('[jwt.js] Re-initializing jwt');
    if (!INITIAL_JWT_OPTIONS) {
        return;
    }

    resetKeyCount(FAIL_COUNT_NAME);
    if (state.keycloak) {state.keycloak.removeIframeFromDom();}

    init(INITIAL_JWT_OPTIONS);
}

/**
 * Kicks off all the session-related things.
 *
 * @memberof module:jwt
 * @private
 */
function init(jwtOptions) {
    log('[jwt.js] initializing');
    INITIAL_JWT_OPTIONS = Object.assign({}, jwtOptions);
    const options = jwtOptions.keycloakOptions ? Object.assign({}, DEFAULT_KEYCLOAK_OPTIONS, jwtOptions.keycloakOptions) : DEFAULT_KEYCLOAK_OPTIONS;
    options.url = !options.url ? ssoUrl(options.internalAuth) : options.url;
    disablePolling = jwtOptions.disablePolling;
    initialUserToken = null;

    // Token names are now namespaced by clientId, thus moving the token_name evaluation
    // and token initialization into the init function where we get the actual clientId
    // We don't need to change COOKIE_TOKEN_NAME as its domain specific and will not
    // conflict with other applications.
    TOKEN_NAME = `${options.clientId}${TOKEN_SURFIX}`;
    COOKIE_TOKEN_NAME = TOKEN_NAME;
    REFRESH_TOKEN_NAME = `${options.clientId}${REFRESH_TOKEN_NAME_SURFIX}`;
    FAIL_COUNT_NAME = `${options.clientId}${FAIL_COUNT_NAME_SURFIX}`;
    // Remove Cookie if present
    if (!INITIAL_JWT_OPTIONS.generateJwtTokenCookie && lib.getCookieValue(COOKIE_TOKEN_NAME)) {
        document.cookie = COOKIE_TOKEN_NAME + `=;expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=.${origin}; path=/; secure;`;
    }

    token = getStoredTokenValue();
    refreshToken = lib.store.local.get(REFRESH_TOKEN_NAME);

    if (token && token !== 'undefined') { DEFAULT_KEYCLOAK_INIT_OPTIONS.token = token; }

    if (refreshToken) { DEFAULT_KEYCLOAK_INIT_OPTIONS.refreshToken = refreshToken; }

    state.keycloak = Keycloak(options);

    // wire up our handlers to keycloak's events
    state.keycloak.onAuthSuccess = onAuthSuccessCallback;
    state.keycloak.onAuthError = onAuthError;
    state.keycloak.onTokenExpired = onTokenExpiredCallback;

    return state.keycloak
    .init(jwtOptions.keycloakInitOptions ? Object.assign(
        {},
        DEFAULT_KEYCLOAK_INIT_OPTIONS,
        jwtOptions.keycloakInitOptions) : DEFAULT_KEYCLOAK_INIT_OPTIONS)
    .success(keycloakInitSuccess)
    .error(keycloakInitError);
}

/**
 * Keycloak init success handler.
 * @memberof module:jwt
 * @param {Boolean} authenticated whether the user is authenticated or not
 * @private
 */
function keycloakInitSuccess(authenticated) {
    log('[jwt.js] initialized (authenticated: ' + authenticated + ')');
    if (authenticated) {
        setToken(state.keycloak.token);
        setRefreshToken(state.keycloak.refreshToken);
        initialUserToken = state.keycloak.tokenParsed;
        resetKeyCount(FAIL_COUNT_NAME).then(() => {
            startRefreshLoop();
        }).catch(() => {
            log('[jwt.js] unable to reset the fail count');
            startRefreshLoop();
        });

        // initialize re-login iframe only after the application has initialized
        if (INITIAL_JWT_OPTIONS.reLoginIframeEnabled && INITIAL_JWT_OPTIONS.reLoginIframe) {
            let iframeJwtOptions = Object.assign({}, INITIAL_JWT_OPTIONS);
            iframeJwtOptions.reLoginIframeEnabled = false;
            iframeJwtOptions.reLoginIframe = null;
            // no need to broadcast messages from iframe
            iframeJwtOptions.disableBroadcastMessage = true;
            const iframeMessage = { value: iframeJwtOptions, message: 'init' };
            INITIAL_JWT_OPTIONS.reLoginIframe.contentWindow.postMessage(JSON.stringify(iframeMessage), '*');
        }
    }

    state.initialized = true;
    handleInitEvents();
}

/**
 * Call any init event handlers that have are registered.
 *
 * @memberof module:jwt
 * @private
 */
function handleInitEvents() {
    if (events.init.length > 0) {
        events.init.forEach((event) => {
            if (typeof event === 'function') {
                event(Jwt);
            }
        });
    }
}

/**
 * Call init error events
 *
 * @memberof module:jwt
 * @private
 */
function handleInitErrorEvents() {
    if (events.initError.length > 0) {
        events.initError.forEach((event) => {
            if (typeof event === 'function') {
                event(Jwt);
            }
        });
    }
}

/**
 * Call Token expired events
 *
 * @memberof module:jwt
 * @private
 */
function handleTokenExpiredEvents() {
    if (events.tokenExpired.length > 0) {
        events.tokenExpired.forEach((event) => {
            if (typeof event === 'function') {
                event(Jwt);
            }
        });
    }
}

/**
 * Call any token event handlers that have are registered.  One time call then removed.
 *
 * @memberof module:jwt
 * @private
 */
function handleTokenEvents() {
    while (events.token.length) {
        const event = events.token.shift();
        if (typeof event === 'function') {
            event(Jwt);
        }
    }
}

/**
 * Call any token mismatch event handlers that have are registered.  One time call then removed.
 *
 * @memberof module:jwt
 * @private
 */
function handleTokenMismatchEvents() {
    while (events.tokenMismatch.length) {
        const event = events.tokenMismatch.shift();
        if (typeof event === 'function') {
            event(Jwt);
        }
    }
}

/**
 * Call any token mismatch event handlers that have are registered.  One time call then removed.
 *
 * @memberof module:jwt
 * @private
 */
function handleJwtTokenUpdateFailedEvents() {
    while (events.jwtTokenUpdateFailed.length) {
        const event = events.jwtTokenUpdateFailed.shift();
        if (typeof event === 'function') {
            event(Jwt);
        }
    }
}

/**
 * Register a function to be called when jwt.js has initialized.  Runs
 * immediately if already initialized.  When called, the function will be
 * passed a reference to the jwt.js API.
 *
 * @memberof module:jwt
 */
function onInit(func) {
    log('[jwt.js] registering init handler');
    if (state.initialized) {
        log(`[jwt.js] running event handler: onInit`);
        func(Jwt);
    }
    else {
        events.init.push(func);
    }
}

/**
 * Keycloak init error handler.
 * @memberof module:jwt
 * @private
 */
function keycloakInitError() {
    log('[jwt.js] init error');
    state.initialized = false;
    handleInitErrorEvents();
    removeToken();
    removeRefreshToken();
    cancelRefreshLoop(); // Cancel update token refresh loop
}

/**
 * Creates a URL to the SSO service based on an old IDP URL.
 *
 * @memberof module:jwt
 * @returns {String} a URL to the SSO service
 * @private
 */
function ssoUrl(isInternal) {
    const subDomain = isInternal === true ? 'auth' : 'sso'; // defaults to sso
    switch (location.hostname) {
        // Valid PROD URLs
        case 'access.redhat.com':
        case 'prod.foo.redhat.com':
        case 'rhn.redhat.com':
        case 'hardware.redhat.com':
        case 'unified.gsslab.rdu2.redhat.com':
            log('[jwt.js] ENV: prod');
            return `https://${subDomain}.redhat.com/auth`;

        // Valid QA URLs
        case 'access.qa.redhat.com':
        case 'access.qa.itop.redhat.com':
        case 'qa.foo.redhat.com':
        case 'accessqa.usersys.redhat.com':
        case 'unified-qa.gsslab.pnq2.redhat.com':
            log('[jwt.js] ENV: qa');
            return `https://${subDomain}.qa.redhat.com/auth`;

        // Valid CI URLs
        case 'access.devgssci.devlab.phx1.redhat.com':
        case 'accessci.usersys.redhat.com':
        case 'access.ci.itop.redhat.com':
        case 'ci.foo.redhat.com':
        default: {
            log('[jwt.js] ENV: ci');
            const subSubDomain = isInternal === true ? 'dev' : 'dev2';
            return `https://${subDomain}.${subSubDomain}.redhat.com/auth`;
        }
    }
}

/**
 * A handler for when authentication is successfully established.
 *
 * @memberof module:jwt
 * @private
 */
function onAuthSuccessCallback() {
    log('[jwt.js] onAuthSuccessCallback');
}

function onAuthError() {
    removeToken();
    removeRefreshToken();
    cancelRefreshLoop(); // Cancel update token refresh loop
    log('[jwt.js] onAuthError');
}

function onTokenExpiredCallback() {
    log('[jwt.js] onTokenExpired');
    handleTokenExpiredEvents();
}

/**
 * Refreshes the access token.  Recursively can be called with an iteration count
 * where the function will retry x number of times.
 *
 * @memberof module:jwt
 * @private
 */

async function updateToken(force) {
    const isFailCountPassed = await failCountPassed(FAIL_COUNT_NAME, FAIL_COUNT_THRESHOLD);
    return new Promise((resolve, reject) => {
        try {
            if (isFailCountPassed && force !== true) {
                const msg = `Not updating token because updating failed more than ${FAIL_COUNT_THRESHOLD} times in a row`;
                log(`[jwt.js] ${msg}`);
                reject(msg);
            } else {
                log('[jwt.js] running updateToken');
                state.keycloak
                .updateToken(force === true ? -1 : REFRESH_TTE)
                .success((refreshed) => {
                    updateTokenSuccess(refreshed);
                    resolve(refreshed);
                })
                // ITokenUpdateFailure
                .error((e) => {
                    updateTokenFailure(e);
                    reject(e);
                });
            }
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Start the {@link module:jwt.refreshLoop refreshLoop}, which
 * periodically updates the authentication token.  This should only ever
 * be called manually if manually first cancelling the refresh loop
 *
 * @memberof module:jwt
 * @private
 */
function startRefreshLoop() {
    refreshLoop();
    if (disablePolling === true) {
        log('[jwt.js] Not starting the refresh loop interval as disablePolling is true.');
    } else {
        if (!refreshIntervalId) {
            log('[jwt.js] Starting refresh loop.');
            refreshIntervalId = setInterval(refreshLoop, REFRESH_INTERVAL);
        } else {
            log('[jwt.js] Cannot start refresh loop as it is already started.');
        }
    }
}

/**
 * Cancel the {@link module:jwt.refreshLoop refreshLoop}
 * @memberof module:jwt
 * @private
 */
function cancelRefreshLoop() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        log('[jwt.js] token refresh interval cancelled');
    }
}

/**
 * This is run periodically by {@link module:jwt.startRefreshLoop
 * startRefreshLoop}.
 *
 * @memberof module:jwt
 * @private
 */
function refreshLoop() {
    return updateToken().then((refreshed) => {
        log('[jwt.js] The refresh loop ' + ['did not refresh', 'refreshed'][~~refreshed] + ' the token');
        return refreshed;
    }).catch((e) => {
        log(`[jwt.js] The refresh loop failed to update the token due to: ${e}`);
        if (e && e.message && e.message.indexOf('not match') !== -1) {
            handleTokenMismatchEvents();
        }

        return false;
    });
}

/**
 * Handler run when a token is successfully updated.
 *
 * @memberof module:jwt
 * @private
 */
function updateTokenSuccess(refreshed) {

    log('[jwt.js] updateTokenSuccess, token was ' + ['not ', ''][~~refreshed] + 'refreshed');
    if (refreshed) {
        resetKeyCount(FAIL_COUNT_NAME); // token update worked, so reset number of consecutive failures
    }

    setToken(state.keycloak.token);
    setRefreshToken(state.keycloak.refreshToken);

    if (timeSkew === null && state.keycloak.timeSkew !== null) {
        timeSkew = state.keycloak.timeSkew;
        handleTokenEvents();
    }
}

/**
 * Handler run when a token update fails.
 *
 * @memberof module:jwt
 * @private
 */
function updateTokenFailure() {
    log('[jwt.js] updateTokenFailure');
    let userLoginTime = undefined;
    if (initialUserToken) {
        userLoginTime = (+new Date() - initialUserToken.auth_time * 1000) / 1000 / 60 / 60;
    }

    failCountEqualsThreshold(FAIL_COUNT_NAME, FAIL_COUNT_THRESHOLD).then((isfailCountEqualsThreshold) => {
        if (isfailCountEqualsThreshold) {
            console.error(
                `[jwt.js] Update token failure: after ${FAIL_COUNT_THRESHOLD} attempts within ${userLoginTime} hours of logging in`
            );
        }

        incKeyCount(FAIL_COUNT_NAME);
    });
    handleJwtTokenUpdateFailedEvents();
}

/**
 * Save the refresh token value in a semi-persistent place (sessionStorage).
 *
 * @memberof module:jwt
 * @private
 */
function setRefreshToken(refreshToken) {
    log('[jwt.js] setting refresh token');
    lib.store.local.set(REFRESH_TOKEN_NAME, refreshToken);
}

/**
 * Remove the token value from its a semi-persistent place.
 *
 * @memberof module:jwt
 * @private
 */
function removeRefreshToken() {
    log('[jwt.js] removing refresh token');
    lib.store.local.remove(REFRESH_TOKEN_NAME);
}

/**
 * Save the token value in a semi-persistent place (cookie).
 *
 * @memberof module:jwt
 * @private
 */
function setToken(token) {
    // make sure token is defined
    if (token) {
        // save the token in localStorage AND in a cookie.  the cookie
        // exists so it'll be sent along with AJAX requests.  the
        // localStorage value exists so the token can be refreshed even if
        // it's been expired for a long time.
        log('[jwt.js] setting access token');
        lib.store.local.set(TOKEN_NAME, token);
        if (INITIAL_JWT_OPTIONS.generateJwtTokenCookie) {
            document.cookie = COOKIE_TOKEN_NAME + '=' + token + ';path=/;max-age=' + 15 * 60 + ';domain=.' + origin + ';secure;';
        }
    }
}

/**
 * Remove the token value from its a semi-persistent place.
 *
 * @memberof module:jwt
 * @private
 */
function removeToken() {
    log('[jwt.js] removing access token');
    lib.store.local.remove(TOKEN_NAME);
    // Remove cookie if present
    if (lib.getCookieValue(COOKIE_TOKEN_NAME)) {
        document.cookie = COOKIE_TOKEN_NAME + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=.' + origin + '; path=/;secure;';
    }
}

/**
 * Get the token value stored in the lib.  This method should always be used to get the token value
 * when constructing ajax calls in apps depending on jwt.js.  This ensures that the token is being
 * fetched from localStorage which is cross tab vs. on the keycloak instance which is per tab.
 *
 * If this method falls back to the getCookieValue, which I believe is per tab, then it still may succumb
 * to token expired errors to due to stale
 *
 * Note that the token is technically kept in sync across tabs, but this is the safest function to access
 * the latest token with
 *
 * @memberof module:jwt
 * @return {Object} the parsed JSON Web Token
 */
function getStoredTokenValue() {
    const token = lib.store.local.get(TOKEN_NAME);
    return token ? token : INITIAL_JWT_OPTIONS.generateJwtTokenCookie ? lib.getCookieValue(COOKIE_TOKEN_NAME) : undefined;
}

/**
 * Get the user info from the JSON Web Token.  Contains user information
 * similar to what the old userStatus REST service returned.
 *
 * @memberof module:jwt
 * @return {Object} the user information
 */
/* eslint-disable camelcase */
function getUserInfo() {
    // the properties to return
    const token = state.keycloak.tokenParsed;
    return token ? {
        identity: {
            id: token.user_id,
            org_id: token.account_id,
            account_number: token.account_number,
            username: token.username,
            email: token.email,
            first_name: token.firstName,
            last_name: token.lastName,
            full_name: `${token.firstName} ${token.lastName}`,
            address_string: `"${token.firstName} ${token.lastName}" ${token.email}`,
            is_active: true,
            locale: token.lang,
            is_org_admin: lodash.includes(token.realm_access.roles, 'admin:org:all'),
            is_internal: lodash.includes(token.realm_access.roles,  'redhat:employees')
        }
    } : null;
}
/* eslint-enable camelcase */

/**
 * Is the user authenticated?
 *
 * @memberof module:jwt
 * @returns {Boolean} true if the user is authenticated, false otherwise
 */
function isAuthenticated() {
    return state.keycloak.authenticated;
}

/**
 * "Decorator" enforcing that jwt.js be initialized before the wrapped
 * function will be run.
 *
 * @memberof module:jwt
 * @private
 * @param {Function} func a function which shouldn't be run before jwt.js is
 * initialized.
 * @return {Function}
 */
function initialized(func) {
    return function () {
        if (state.initialized) {
            return func.apply({}, arguments);
        }
        else {
            console.warn('[jwt.js] couldn\'t call function, session not initialized');
            return;
        }
    };
}

/**
 * Logs the user in.  An unauthenticated user will be sent to the
 * credentials form and then back to the current page.  An authenticated
 * user will be sent to the Keycloak server but bounced back to the current
 * page right away.
 *
 * @memberof module:jwt
 * @param {Object} options
 */
function login(options = {}) {
    const redirectUri = options.redirectUri || location.href;
    options.redirectUri = redirectUri;
    return state.keycloak.login(options);
}

/**
 * Navigate to the logout page, end session, then navigate back.
 * @memberof module:jwt
 */
function logout(options = {}) {
    removeToken();
    removeRefreshToken();
    resetKeyCount(FAIL_COUNT_NAME);
    cancelRefreshLoop(); // Cancel update token refresh loop
    if (!options.skipRedirect) {
        state.keycloak.logout(options);
    }
}

/**
  * Get the count of the $key.
  * @return {Number} Get the count of the $key.
  * @memberof module:jwt
  */
function getCountForKey(key) {
    try {
        return CacheUtils.get(key).then((countCache) => {
            return countCache.value;
        }).catch(() => {
            return 0;
        });
    } catch (e) {
        return Promise.resolve(0);
    }
}

/**
 * Return whether or not the consecutive failure count has been exceeded.
 * @memberof module:jwt
 * @return {Boolean} has the consecutive failure count been exceeded
 */
function failCountPassed(key, threshold) {
    return getCountForKey(key).then((count) => {
        return count > threshold;
    });
}

/**
 * Return whether or not the consecutive failure count is equal to threshold.
 * @memberof module:jwt
 * @return {Boolean} is the consecutive failure count equal to threshold
 */
function failCountEqualsThreshold(key, threshold) {
    return getCountForKey(key).then((count) => {
        return count === threshold;
    });
}

/**
 * Increment the value of the $key.
 * @return {Number} Increment the value of the $key and return new key count.
 */
function incKeyCount(key) {
    return getCountForKey(key).then((keyCount) => {
        const newKeyCount = keyCount + 1;
        const newFailCountCache = {
            value: newKeyCount
        };
        CacheUtils.set(key, newFailCountCache);
        return newKeyCount;
    });
}

/**
 * Reset the value of $key to zero.
 */
function resetKeyCount(key) {
    const newSentryLogCountCache = {
        value: 0
    };
    return CacheUtils.set(key, newSentryLogCountCache);
}
