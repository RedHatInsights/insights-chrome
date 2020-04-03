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
import RootApp from './App/RootApp';
import debugFunctions from './debugFunctions';
import NoAccess from './App/NoAccess';

const log = require('./jwt/logger')('entry.js');
const sourceOfTruth = require('./nav/sourceOfTruth');
import { fetchPermissions } from './rbac/fetchPermissions';

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
    .then(async () => {
        const user = await libjwt.jwt.getUserInfo();
        actions.userLogIn(user);
        const navigationYml = await sourceOfTruth(libjwt.jwt.getEncodedToken());
        const navigationData = await loadNav(navigationYml);
        chromeNavUpdate(navigationData);
        loadChrome(user);
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

            appNavClick({
                ...payload,
                custom: true
            });
        },
        on: (type, callback) => {
            if (!Object.prototype.hasOwnProperty.call(PUBLIC_EVENTS, type)) {
                throw new Error(`Unknown event type: ${type}`);
            }

            return middlewareListener.addNew(PUBLIC_EVENTS[type](callback));
        },
        $internal: { store },
        loadInventory,
        experimental: {
            loadRemediations
        },
        enable: debugFunctions
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
            getUserPermissions: (app = '') => {
                return fetchPermissions(libjwt.jwt.getEncodedToken(), app);
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
async function loadNav(yamlConfig) {
    const groupedNav = await getNavFromConfig(safeLoad(yamlConfig));

    const splitted = location.pathname.split('/') ;
    const [active, section] = splitted[1] === 'beta' ? [splitted[2], splitted[3]] : [splitted[1], splitted[2]];
    const globalNav = (groupedNav[active] || groupedNav.insights).routes;
    let activeSection = globalNav.find(({ id }) => id === section);
    return groupedNav[active] ? {
        globalNav,
        activeTechnology: groupedNav[active].title,
        activeLocation: active,
        activeSection
    } : {
        globalNav,
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
                if (activeApp && Object.prototype.hasOwnProperty.call(activeApp, 'subItems')) {
                    defaultActive = activeApp.subItems.find(
                        subItem => location.pathname.split('/').find(item => item === subItem.id)
                    ) || activeApp.subItems.find(subItem => subItem.default)
                    || activeApp.subItems[0];
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
}

export function noAccess() {
    const { store } = spinUpStore();
    window.insights.chrome.auth.getUser().then(({ entitlements }) => {
        if (!consts.allowedUnauthedPaths.includes(location.pathname)) {
            const path = location.pathname.split('/');
            const apps = Object.keys(entitlements);

            /* eslint-disable camelcase */
            const grantAccess = Object.entries(entitlements).filter(([app, { is_entitled }]) => {
            // check if app key from entitlements is anywhere in URL and if so check if user is entitled for such app
                return path.includes(app) && is_entitled;
            });
            /* eslint-enable camelcase */

            // also grant access to other pages like settings/general
            const isTrackedApp = path.some(value => apps.includes(value));
            if (!(grantAccess && grantAccess.length > 0) && isTrackedApp) {
                document.getElementById('root').style.display = 'none';
                document.querySelector('#no-access.pf-c-page__main').style.display = 'block';
                render(
                    <Provider store={ store }>
                        <NoAccess />
                    </Provider>,
                    document.querySelector('#no-access')
                );
            }
        }
    })
    .catch(log('Error fetching user entitlements!'));
}
