import React, { lazy, Suspense, Fragment } from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { globalFilterScope, toggleGlobalFilter } from './redux/actions';
import { spinUpStore } from './redux-config';
import * as actionTypes from './redux/action-types';
import loadInventory from './inventory/index';
import loadRemediations from './remediations';
import qe from './iqeEnablement';
import consts from './consts';
import allowUnauthed from './auth';
import { loadNav } from './nav/globalNav.js';
import RootApp from './App/RootApp';
import debugFunctions from './debugFunctions';
import { visibilityFunctions } from './consts';
import Cookies from 'js-cookie';
import logger from './jwt/logger';
import sourceOfTruth from './nav/sourceOfTruth';
import { fetchPermissions } from './rbac/fetchPermissions';
import { getUrl } from './utils';
import flatMap from 'lodash/flatMap';

const UnauthedHeader = lazy(() => import(/* webpackChunkName: "UnAuthtedHeader" */ './App/Header/UnAuthtedHeader'));
const Header = lazy(() => import(/* webpackChunkName: "Header" */ './App/Header'));
const Sidenav = lazy(() => import(/* webpackChunkName: "Sidenav" */ './App/Sidenav'));
const NoAccess = lazy(() => import(/* webpackChunkName: "NoAccess" */ './App/NoAccess'));

const log = logger('entry.js');

// used for translating event names exposed publicly to internal event names
const PUBLIC_EVENTS = {
    APP_NAVIGATION: fn => ({
        on: actionTypes.APP_NAV_CLICK,
        callback: ({ data }) => {
            if (data.id !== undefined || data.event) {
                fn({ navId: data.id, domEvent: data.event });
            }
        }
    }),
    NAVIGATION_TOGGLE: callback => ({
        on: actionTypes.NAVIGATION_TOGGLE,
        callback
    }),
    GLOBAL_FILTER_UPDATE: callback => ({
        on: actionTypes.GLOBAL_FILTER_UPDATE,
        callback
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
        (async () => {
            const navigationYml = await sourceOfTruth(libjwt.jwt.getEncodedToken());
            const navigationData = await loadNav(navigationYml);
            chromeNavUpdate(navigationData);
        })();
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
        hideGlobalFilter: (isHidden) => store.dispatch(toggleGlobalFilter(isHidden)),
        globalFilterScope: (scope) => store.dispatch(globalFilterScope(scope)),
        mapGlobalFilter: (filter) => flatMap(
            Object.entries(filter),
            ([namespace, item]) => Object.entries(item)
            .filter(([, { isSelected }]) => isSelected)
            .map(([groupKey, { item, value: tagValue }]) => `${
                namespace ? `${namespace}/` : ''
            }${
                groupKey
            }${
                (item?.tagValue || tagValue) ? `=${item?.tagValue || tagValue}` : ''
            }`)
        ),
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
            isPenTest: () => {
                return Cookies.get('x-rh-insights-pentest') ? true : false;
            },
            getBundle: () => {
                return getUrl('bundle');
            },
            getApp: () => {
                return getUrl('app');
            },
            visibilityFunctions,
            init: initFunc
        },
        loadInventory,
        experimental: {
            loadRemediations
        }
    };
}

function loadChrome(user) {
    const { store } = spinUpStore();

    render(
        <Provider store={store}>
            <Suspense fallback={Fragment}>
                { user ? <Header /> : <UnauthedHeader /> }
            </Suspense>
        </Provider>,
        document.querySelector('header')
    );

    // Conditionally add classes if it's the pen testing environment
    if (window.insights.chrome.isPenTest()) {
        document.querySelector('header').classList.add('ins-c-pen-test');
    }

    if (document.querySelector('aside')) {
        render(
            <Provider store={store}>
                <Suspense fallback={Fragment}>
                    <Sidenav />
                </Suspense>
            </Provider>,
            document.querySelector('aside')
        );
    }

    const tempContent = document.querySelector('#temp');
    if (tempContent) {
        tempContent.remove();
    }
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
                        <Suspense fallback={Fragment}>
                            <NoAccess />
                        </Suspense>
                    </Provider>,
                    document.querySelector('#no-access')
                );
            }
        }
    })
    .catch(log('Error fetching user entitlements!'));
}
