import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { appNavClick } from './redux/actions';
import { spinUpStore } from './redux-config';
import * as actionTypes from './redux/action-types';
import loadInventory from './inventory';
import loadRemediations from './remediations';
import qe from './iqeEnablement';
import consts from './consts';
import allowUnauthed from './auth';
import { safeLoad } from 'js-yaml';
import { getNavFromConfig } from './nav/globalNav.js';
const sourceOfTruth = require('./nav/sourceOfTruth');

// used for translating event names exposed publicly to internal event names
const PUBLIC_EVENTS = {
    APP_NAVIGATION: fn => ({
        on: actionTypes.APP_NAV_CLICK,
        callback: ({ data }) => {
            if (data.id !== undefined || data.event) {
                fn({ navId: data.id, domEvent: data.event });
            }
        }
    })
};

export function chromeInit(libjwt) {
    const { store, middlewareListener, actions } = spinUpStore();

    // public API actions
    const { identifyApp, appNav, appNavClick, clearActive, appAction, appObjectId, chromeNavUpdate } = actions;

    // Init JWT first.
    const jwtAndNavResolver = libjwt.initPromise
    .then(libjwt.jwt.getUserInfo)
    .then((user) => {
        // Log in the user
        actions.userLogIn(user);
        // Then, generate the global nav from the source of truth.
        // We use the JWT token as part of the cache key.
        return sourceOfTruth(libjwt.jwt.getEncodedToken())
        // Gets the navigation for the current bundle.
        .then(loadNav)
        // Updates Redux's state with the new nav.
        .then(chromeNavUpdate)
        .then(() => loadChrome(user));
    })
    .catch(() => allowUnauthed() && loadChrome(false));

    return {
        identifyApp: (data) => {
            return jwtAndNavResolver.then(() => identifyApp(data, store.getState().chrome.globalNav));
        },
        navigation: appNav,
        appAction,
        appObjectId,
        appNavClick: ({ secondaryNav, ...payload }) => {
            if (!secondaryNav) {
                clearActive();
            }

            appNavClick(payload);
        },
        on: (type, callback) => {
            if (!PUBLIC_EVENTS.hasOwnProperty(type)) {
                throw new Error(`Unknown event type: ${type}`);
            }

            return middlewareListener.addNew(PUBLIC_EVENTS[type](callback));
        },
        $internal: { store },
        loadInventory,
        experimental: {
            loadRemediations
        }

    };
}

export function bootstrap(libjwt, initFunc) {
    return {
        chrome: {
            auth: {
                getOfflineToken: () => {
                    return libjwt.getOfflineToken();
                },
                doOffline: () => {
                    libjwt.jwt.doOffline(consts.noAuthParam, consts.offlineToken);
                },
                getToken: () => {
                    return new Promise((res) => {
                        libjwt.jwt.getUserInfo().then(() => {
                            res(libjwt.jwt.getEncodedToken());
                        });
                    });
                },
                getUser: () => {
                    // here we need to init the qe plugin
                    // the "contract" is we will do this before anyone
                    // calls/finishes getUser
                    // this only does something if the correct localstorage
                    // vars are set

                    qe.init();

                    return libjwt.initPromise
                    .then(libjwt.jwt.getUserInfo)
                    .catch(() => {
                        libjwt.jwt.logoutAllTabs();
                    });
                },
                qe: qe,
                logout: (bounce) => libjwt.jwt.logoutAllTabs(bounce),
                login: () => libjwt.jwt.login()
            },
            isProd: window.location.host === 'cloud.redhat.com',
            isBeta: () => {
                return (window.location.pathname.split('/')[1] === 'beta' ? true : false);
            },
            init: initFunc
        },
        loadInventory,
        experimental: {
            loadRemediations
        }
    };
}

// Loads the navigation for the current bundle.
function loadNav(yamlConfig) {
    const groupedNav = getNavFromConfig(safeLoad(yamlConfig));

    const splitted = location.pathname.split('/') ;
    const active = splitted[1] === 'beta' ? splitted[2] : splitted[1];
    return groupedNav[active] ? {
        globalNav: groupedNav[active].routes,
        activeTechnology: groupedNav[active].title,
        activeLocation: active
    } : {
        globalNav: groupedNav.insights.routes,
        activeTechnology: 'Applications'
    };
}

function loadChrome(user) {

    import('./App/index').then(
        ({ UnauthedHeader, Header, Sidenav }) => {
            const { store } = spinUpStore();
            const chromeState = store.getState().chrome;
            let defaultActive = {};

            if (chromeState && !chromeState.appNav && chromeState.globalNav) {
                const activeApp = chromeState.globalNav.find(item => item.active);
                if (activeApp && activeApp.hasOwnProperty('subItems')) {
                    defaultActive = activeApp.subItems.find(
                        subItem => location.pathname.split('/').find(item => item === subItem.id)
                    ) || activeApp.subItems.find(subItem => subItem.default);
                }
            }

            store.dispatch(appNavClick(defaultActive));

            render(
                <Provider store={store}>
                    { user ? <Header /> : <UnauthedHeader /> }
                </Provider>,
                document.querySelector('header')
            );

            if (document.querySelector('aside')) {
                render(
                    <Provider store={store}>
                        <Sidenav />
                    </Provider>,
                    document.querySelector('aside')
                );
            }

            const tempContent = document.querySelector('#temp');
            if (tempContent) {
                tempContent.remove();
            }
        }
    );
}

export function rootApp() {
    import('./App/index').then(({ RootApp }) => {
        const { store } = spinUpStore();
        const pageRoot = document.querySelector('.pf-c-page__drawer');
        if (pageRoot) {
            render(
                <Provider store={store}>
                    <RootApp />
                </Provider>,
                pageRoot
            );
        }
    });
}
