const Keycloak = require('keycloak-js');

import '@babel/polyfill';

import {
    CacheUtils
} from './cacheUtils';

const lodash = require('lodash');

const Jwt = {
    login: initialized(login),
    logout: initialized(logout),
    register: initialized(register),
    hasRole: initialized(hasRole),
    isInternal: initialized(isInternal),
    isAuthenticated: initialized(isAuthenticated),
    getRegisterUrl: initialized(getRegisterUrl),
    getLoginUrl: initialized(getLoginUrl),
    getLogoutUrl: initialized(getLogoutUrl),
    getAccountUrl: initialized(getAccountUrl),
    getToken: initialized(getToken),
    getStoredTokenValue: initialized(getStoredTokenValue),
    getEncodedToken: initialized(getEncodedToken),
    getUserInfo: initialized(getUserInfo),
    updateToken: initialized(updateToken),
    cancelRefreshLoop: initialized(cancelRefreshLoop),
    startRefreshLoop: initialized(startRefreshLoop),
    isTokenExpired: initialized(isTokenExpired),
    onInit: onInit,
    onInitError: onInitError,
    onAuthRefreshError: onAuthRefreshError,
    onAuthRefreshSuccess: onAuthRefreshSuccess,
    onAuthLogout: onAuthLogout,
    onTokenExpired: onTokenExpired,
    onInitialUpdateToken: onInitialUpdateToken,
    onTokenMismatch: onTokenMismatch,
    onJwtTokenUpdateFailed: onJwtTokenUpdateFailed,
    onAuthError: onAuthError,
    init: init,
    reinit: reinit,
    getCountForKey: getCountForKey,
    failCountPassed: failCountPassed,
    expiresIn: expiresIn
};

export default Jwt;

// Use Polyfill for BroadcastChannel if not supported natively by browser
if (!('BroadcastChannel' in window)) {
    log(`[jwt.js] Using polyfill for BroadcastChannel`);
    (function (context) {
        // Internal variables
        let _channels = null;
        // List of channels

        let _tabId = null;
        // Current window browser tab identifier (see IE problem, later)

        let _prefix = 'polyBC_'; // prefix to identify localStorage keys.

        /**
         * Internal function, generates pseudo-random strings.
         * @see http://stackoverflow.com/a/1349426/2187738
         * @private
         */
        function getRandomString(length) {
            let text = '';

            let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < (length || 5); i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
        }

        /**
         * Check if an object is empty.
         * @see http://stackoverflow.com/a/679937/2187738
         * @private
         */
        function isEmpty(obj) {
            for (let prop in obj) {
                if (obj.hasOwnProperty(prop))
                {return false;}
            }

            return true;
            // Also this is good.
            // returns 0 if empty or an integer > 0 if non-empty
            // return Object.keys(obj).length;
        }

        /**
         * Gets the current timestamp
         * @private
         */
        function getTimestamp() {
            return (new Date().getTime());
        }

        /**
         * Build a "similar" response as done in the real BroadcastChannel API
         */
        function buildResponse(data) {
            return {
                timestamp: getTimestamp(),
                isTrusted: true,
                target: null, // Since we are using JSON stringify, we cannot pass references.
                currentTarget: null,
                data: data,
                bubbles: false,
                cancelable: false,
                defaultPrevented: false,
                lastEventId: '',
                origin: context.location.origin
            };
        }

        /**
         * Creates a new BroadcastChannel
         * @param {String} channelName - the channel name.
         * return {BroadcastChannel}
         */
        function BroadcastChannel(channelName) {

            // Check if localStorage is available.
            if (!context.localStorage) {
                throw 'localStorage not available';
            }

            // Add custom prefix to Channel Name.
            let _channelId = _prefix + channelName;

            let isFirstChannel = (_channels === null);

            this.channelId = _channelId;

            _tabId = _tabId || getRandomString(); // Creates a new tab identifier, if necessary.
            _channels = _channels || {}; // Initializes channels, if necessary.
            _channels[_channelId] = _channels[_channelId] || [];

            // Adds the current Broadcast Channel.
            _channels[_channelId].push(this);

            // Creates a sufficiently random name for the current instance of BC.
            this.name = _channelId + '::::' + getRandomString() + getTimestamp();

            // If it is the first instance of Channel created, also creates the storage listener.
            if (isFirstChannel) {
                // addEventListener.
                context.addEventListener('storage', _onmsg.bind(this), false);
            }

            return this;
        }

        /**
         * Empty function to prevent errors when calling onmessage.
         */
        BroadcastChannel.prototype.onmessage = function () { };

        /**
         * Sends the message to different channels.
         * @param {Object} data - the data to be sent ( actually, it can be any JS type ).
         */
        BroadcastChannel.prototype.postMessage = function (data) {
            // Gets all the 'Same tab' channels available.
            if (!_channels) {return;}

            if (this.closed) {
                throw 'This BroadcastChannel is closed.';
            }

            // Build the event-like response.
            let msgObj = buildResponse(data);

            // SAME-TAB communication.
            let subscribers = _channels[this.channelId] || [];
            for (let j in subscribers) {
                // We don't send the message to ourselves.
                if (subscribers[j].closed || subscribers[j].name === this.name) {continue;}

                if (subscribers[j].onmessage) {
                    subscribers[j].onmessage(msgObj);
                }
            }

            // CROSS-TAB communication.
            // Adds some properties to communicate among the tabs.
            let editedObj = {
                channelId: this.channelId,
                bcId: this.name,
                tabId: _tabId,
                message: msgObj
            };
            let lsKey = 'eomBCmessage_' + getRandomString() + '_' + this.channelId;
            try {
                let editedJSON = JSON.stringify(editedObj);
                // Set localStorage item (and, after that, removes it).
                context.localStorage.setItem(lsKey, editedJSON);
            } catch (ex) {
                throw 'Message conversion has resulted in an error.';
            }

            setTimeout(function () { context.localStorage.removeItem(lsKey); }, 1000);

        };

        /**
         * Handler of the 'storage' function.
         * Called when another window has sent a message.
         * @param {Object} ev - the message.
         * @private
         */
        function _onmsg(ev) {
            let key = ev.key;

            let newValue = ev.newValue;

            let isRemoved = !newValue;

            let obj = null;

            // Actually checks if the messages if from us.
            if (key.indexOf('eomBCmessage_') > -1 && !isRemoved) {

                try {
                    obj = JSON.parse(newValue);
                } catch (ex) {
                    throw 'Message conversion has resulted in an error.';
                }

                // NOTE: Check on tab is done to prevent IE error
                // (localStorage event is called even in the same tab :( )

                if ((obj.tabId !== _tabId) &&
                    obj.channelId &&
                    _channels &&
                    _channels[obj.channelId]) {

                    let subscribers = _channels[obj.channelId];
                    for (let j in subscribers) {
                        if (!subscribers[j].closed && subscribers[j].onmessage) {
                            subscribers[j].onmessage(obj.message);
                        }
                    }

                    // Remove the item for safety.
                    context.localStorage.removeItem(key);
                }
            }
        }

        /**
         * Closes a Broadcast channel.
         */
        BroadcastChannel.prototype.close = function () {

            this.closed = true;

            let index = _channels[this.channelId].indexOf(this);
            if (index > -1)
            {_channels[this.channelId].splice(index, 1);}

            // If we have no channels, remove the listener.
            if (!_channels[this.channelId].length) {
                delete _channels[this.channelId];
            }

            if (isEmpty(_channels)) {
                context.removeEventListener('storage', _onmsg.bind(this));
            }
        };

        // Sets BroadcastChannel, if not available.
        context.BroadcastChannel = context.BroadcastChannel || BroadcastChannel;

    }(window.top));
}

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

            // if DOM Storage is disabled in other browsers, it may not
            // throw an error, but we should still throw one for them.
            if (!store) {throw new Error('DOM Storage is disabled');}
        } catch (e) {
            // this means DOM storage is disabled in the users' browser, so
            // we'll create an in-memory object that simulates the DOM
            // Storage API.
            store = {
                getItem: function(key) {
                    return store[key];
                },
                setItem: function(key, value) {
                    return (store[key] = value);
                },
                removeItem: function(key) {
                    return delete store[key];
                }
            };
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
    log: function(message) {
        if (typeof console !== 'undefined') {
            console.log(message);
        }
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

const INTERNAL_ROLE = 'redhat:employees';
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
let broadcastChannel = null;

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

    // for multi tab communication
    if (!jwtOptions.disableBroadcastMessage) {
        if (!broadcastChannel) {
            broadcastChannel = new BroadcastChannel(`jwt_${options.realm}`);
        }

        broadcastChannel.onmessage = (e) => {
            log(`[jwt.js] BroadcastChannel, Received event : ${e.data.type}`);
            if (e && e.data && e.data.type === 'Initialized' && !state.keycloak.authenticated && e.data.authenticated) {
                if (options.clientId === e.data.clientId) {
                    reinit();
                } else {
                    if (jwtOptions.reLoginIframeEnabled && jwtOptions.reLoginIframe) {
                        const iframeMessage = { value: null, message: 'reinit' };
                        jwtOptions.reLoginIframe.contentWindow.postMessage(JSON.stringify(iframeMessage), '*');
                    }
                }
            }
        };
    }

    state.keycloak = Keycloak(options);

    // wire up our handlers to keycloak's events
    state.keycloak.onAuthSuccess = onAuthSuccessCallback;
    state.keycloak.onAuthError = onAuthError;
    state.keycloak.onAuthRefreshSuccess = onAuthRefreshSuccessCallback;
    state.keycloak.onAuthRefreshError = onAuthRefreshErrorCallback;
    state.keycloak.onAuthLogout = onAuthLogoutCallback;
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
        initialUserToken = getToken();
        resetKeyCount(FAIL_COUNT_NAME).then(() => {
            startRefreshLoop();
        }).catch(() => {
            log('[jwt.js] unable to reset the fail count');
            startRefreshLoop();
        });
        if (!INITIAL_JWT_OPTIONS.disableBroadcastMessage && broadcastChannel) {
            broadcastChannel.postMessage({
                type: 'Initialized',
                clientId: INITIAL_JWT_OPTIONS.keycloakOptions.clientId,
                authenticated
            });
        }

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

    keycloakInitHandler();
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
 * Call refresh error events
 *
 * @memberof module:jwt
 * @private
 */
function handleRefreshErrorEvents() {
    if (events.refreshError.length > 0) {
        events.refreshError.forEach((event) => {
            if (typeof event === 'function') {
                event(Jwt);
            }
        });
    }
}

/**
 * Call refresh success events
 *
 * @memberof module:jwt
 * @private
 */
function handleRefreshSuccessEvents() {
    if (events.refreshSuccess.length > 0) {
        events.refreshSuccess.forEach((event) => {
            if (typeof event === 'function') {
                event(Jwt);
            }
        });
    }
}

/**
 * Call logout events
 *
 * @memberof module:jwt
 * @private
 */
function handleLogoutEvents() {
    if (events.logout.length > 0) {
        events.logout.forEach((event) => {
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
 * Register a function to be called when jwt.js has initialized and
 * the first token update has successful run
 * @memberof module:jwt
 */
function onInitialUpdateToken(func) {
    log(`[jwt.js] registering the onInitialUpdateToken handler`);
    // We know the setToken has happened at least once when the timeLocal is properly set
    if (state.initialized && state.keycloak.timeSkew !== null) {
        log(`[jwt.js] running event handler: onInitialUpdateToken`);
        func(Jwt);
    } else {
        events.token.push(func);
    }
}

/**
 * Register a function to be called when the tokens mismatch.  This is a hard
 * error caused when mixing sso envs/tokens and requires a logout/log back in
 * @memberof module:jwt
 */
function onTokenMismatch(func) {
    log(`[jwt.js] registering the onTokenMismatch handler`);
    if (state.initialized) {
        log(`[jwt.js] running event handler: onTokenMismatch`);
        func(Jwt);
    } else {
        events.tokenMismatch.push(func);
    }
}

/**
 * Register a function to be called when the tokens mismatch.  This is a hard
 * error caused when mixing sso envs/tokens and requires a logout/log back in
 * @memberof module:jwt
 */
function onJwtTokenUpdateFailed(func) {
    log(`[jwt.js] registering the onJwtTokenUpdateFailed handler`);
    if (state.initialized) {
        log(`[jwt.js] running event handler: onJwtTokenUpdateFailed`);
        func(Jwt);
    } else {
        events.jwtTokenUpdateFailed.push(func);
    }
}

/**
 * Keycloak init error handler.
 * @memberof module:jwt
 * @private
 */
function keycloakInitError() {
    log('[jwt.js] init error');
    keycloakInitErrorHandler();
    removeToken();
    removeRefreshToken();
    cancelRefreshLoop(); // Cancel update token refresh loop
}

/**
 * Does some things after keycloak initializes, whether or not
 * initialization was successful.
 *
 * @memberof module:jwt
 * @private
 */
function keycloakInitHandler() {
    state.initialized = true;
    handleInitEvents();
}

/**
 * Call events after keycloak auth refresh error.
 *
 * @memberof module:jwt
 * @private
 */
function keycloakRefreshErrorHandler() {
    handleRefreshErrorEvents();
}

/**
 * Call events after keycloak auth refresh success.
 *
 * @memberof module:jwt
 * @private
 */
function keycloakRefreshSuccessHandler() {
    handleRefreshSuccessEvents();
}

/**
 * Call events after keycloak auth logout.
 *
 * @memberof module:jwt
 * @private
 */
function keycloakLogoutHandler() {
    handleLogoutEvents();
}

/**
 * Call events after keycloak init error.
 *
 * @memberof module:jwt
 * @private
 */
function keycloakInitErrorHandler() {
    state.initialized = false;
    handleInitErrorEvents();
}

/**
 * Call events after keycloak token expired
 *
 * @memberof module:jwt
 * @private
 */
function keycloakTokenExpiredHandler() {
    handleTokenExpiredEvents();
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

function onAuthRefreshSuccessCallback() {
    log('[jwt.js] onAuthRefreshSuccess');
    keycloakRefreshSuccessHandler();
}

function onAuthRefreshErrorCallback() {
    log('[jwt.js] onAuthRefreshError');
    keycloakRefreshErrorHandler();
}

function onAuthLogoutCallback() {
    log('[jwt.js] onAuthLogout');
    // skip redirect if user is logs out from other tabs.
    logout({ skipRedirect: true });
    keycloakLogoutHandler();
}

/**
 * Register a function to be called when keycloak has failed to refresh the session.  Runs
 * immediately if already initialized.  When called, the function will be
 * passed a reference to the jwt.js API.
 *
 * @memberof module:jwt
 */
function onAuthRefreshError(func) {
    log('[jwt.js] registering auth refresh error handler');
    events.refreshError.push(func);
}

/**
 * Register a function to be called when keycloak has successfully to refresh the session.
 *
 * @memberof module:jwt
 */
function onAuthRefreshSuccess(func) {
    log('[jwt.js] registering auth refresh success handler');
    events.refreshSuccess.push(func);
}

/**
 * Register a function to be called when keycloak has logged out.
 *
 * @memberof module:jwt
 */
function onAuthLogout(func) {
    log('[jwt.js] registering auth logout handler');
    events.logout.push(func);
}

/**
 * Register a function to be called when keycloak init fails.
 *
 * @memberof module:jwt
 */
function onInitError(func) {
    log('[jwt.js] registering init error handler');
    events.initError.push(func);
}

function onTokenExpiredCallback() {
    log('[jwt.js] onTokenExpired');
    keycloakTokenExpiredHandler();
}

/**
 * Register a function to be called when keycloak as expired the token.  Runs
 * immediately if already initialized.  When called, the function will be
 * passed a reference to the jwt.js API.
 *
 * @memberof module:jwt
 */
function onTokenExpired(func) {
    log('[jwt.js] registering token expired handler');
    events.tokenExpired.push(func);
}

/**
 * Checks if the token is expired
 *
 * @memberof module:jwt
 * @private
 */
function isTokenExpired(tte = REFRESH_TTE) {
    return state.keycloak.isTokenExpired(tte) === true;
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
 * Get an object containing the parsed JSON Web Token.  Contains user and session metadata.
 *
 * @memberof module:jwt
 * @return {Object} the parsed JSON Web Token
 */
function getToken() {
    // any here as actual RH tokens have more information than this, which we will customize with IToken above
    return state.keycloak.tokenParsed;
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

/* Get a string containing the unparsed, base64-encoded JSON Web Token.
*
* @memberof module:jwt
* @return {Object} the parsed JSON Web Token
*/
function getEncodedToken() {
    return state.keycloak.token;
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
    const token = getToken();
    return token ? {
        identity: {
            id: token.user_id,
            org_id: token.account_id,
            account_number: token.account_number,
            username: token.username,
            email: token.email,
            first_name: token.firstName,
            last_name: token.lastName,
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
 * Is the user is a Red Hat employee?
 *
 * @memberof module:jwt
 * @returns {Boolean} true if the user is a Red Hat employee, otherwise false
 */
function isInternal() {
    return state.keycloak.hasRealmRole(INTERNAL_ROLE);
}

/**
 * Returns true if the user has all the given role(s).  You may provide any
 * number of roles.
 *
 * @param {...String} roles All the roles you wish to test for.  See
 * examples.
 * @returns {Boolean} whether the user is a member of ALL given roles
 * @example session.hasRole('portal_manage_cases');
 * session.hasRole('role1', 'role2', 'role3');
 * @memberof module:jwt
 */
function hasRole(...roles) {
    if (!roles) {return false;}

    for (let i = 0; i < roles.length; ++i) {
        if (!state.keycloak.hasRealmRole(roles[i])) {
            return false;
        }
    }

    return true;
}

/**
 * Get the URL to the registration page.
 * @return {String} the URL to the registration page
 * @memberof module:jwt
 */
function getRegisterUrl() {
    return state.keycloak.createRegisterUrl();
}

/**
 * Get the URL to the login page.
 * @return {String} the URL to the login page
 * @memberof module:jwt
 */
function getLoginUrl(options = {}) {
    const redirectUri = options.redirectUri || location.href;
    options.redirectUri = redirectUri;
    return state.keycloak.createLoginUrl(options);
}

/**
 * Get the URL to the logout page.
 * @return {String} the URL to the logout page
 * @memberof module:jwt
 */
function getLogoutUrl() {
    return state.keycloak.createLogoutUrl();
}

/**
 * Get the URL to the account management page.
 * @return {String} the URL to the account management page
 * @memberof module:jwt
 */
function getAccountUrl() {
    return state.keycloak.createAccountUrl();
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
 * Navigate to the account registration page.
 * @memberof module:jwt
 */
function register(options) {
    state.keycloak.register(options);
}

/**
 * When the token expires
 * @memberof module:jwt
 * @private
 */
function expiresIn() {
    try {
        return state.keycloak.tokenParsed.exp - Math.ceil(new Date().getTime() / 1000) + state.keycloak.timeSkew;
    } catch (e) {
        return null;
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
