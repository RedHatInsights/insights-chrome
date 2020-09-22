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
import { createFetchPermissionsWatcher } from './rbac/fetchPermissions';
import { getUrl } from './utils';
import flatMap from 'lodash/flatMap';
import { headerLoader } from './App/Header';
import { decodeToken } from './jwt/jwt';
import { CacheAdapter } from './utils/cache';

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
    const { identifyApp, appNavClick, clearActive, appAction, appObjectId, chromeNavUpdate } = actions;

    let chromeCache;
    // Init JWT first.
    const jwtResolver = libjwt.initPromise
    .then(async () => {
        const user = await libjwt.jwt.getUserInfo();
        actions.userLogIn(user);
        chromeCache = new CacheAdapter(
            'chrome-store',
            `${decodeToken(libjwt.jwt.getEncodedToken())?.session_state}-chrome-store`
        );
        headerLoader();
    })
    .catch(() => {
        if (allowUnauthed()) {
            actions.userLogIn(false);
            headerLoader();
        }
    });

    // Load navigation after login
    const navResolver = jwtResolver.then(async () => {
        const navigationYml = await sourceOfTruth(libjwt.jwt.getEncodedToken());
        const navigationData = await loadNav(navigationYml, chromeCache);
        chromeNavUpdate(navigationData);
    });

    return {
        identifyApp: (data) => Promise.all([jwtResolver, navResolver]).then(
            () => identifyApp(data, store.getState().chrome.globalNav)
        ),
        navigation: () => console.error('Don\'t use insights.chrome.navigation, it has been deprecated!'),
        appAction,
        appObjectId,
        hideGlobalFilter: (isHidden) => store.dispatch(toggleGlobalFilter(isHidden)),
        globalFilterScope: (scope) => store.dispatch(globalFilterScope(scope)),
        mapGlobalFilter: (filter, encode = false) => flatMap(
            Object.entries(filter),
            ([namespace, item]) => Object.entries(item)
            .filter(([, { isSelected }]) => isSelected)
            .map(([groupKey, { item, value: tagValue }]) => `${
                namespace ? `${encode ? encodeURIComponent(namespace) : namespace}/` : ''
            }${
                encode ? encodeURIComponent(groupKey) : groupKey
            }${
                (item?.tagValue || tagValue) ? `=${encode ? encodeURIComponent(item?.tagValue || tagValue) : item?.tagValue || tagValue}` : ''
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
    let permissionCache;
    const getUser = () => {
        // here we need to init the qe plugin
        // the "contract" is we will do this before anyone
        // calls/finishes getUser
        // this only does something if the correct localstorage
        // vars are set

        qe.init();

        return libjwt.initPromise
        .then(libjwt.jwt.getUserInfo)
        .then((data) => {
            permissionCache = new CacheAdapter(
                'permission-store',
                `${decodeToken(libjwt.jwt.getEncodedToken())?.session_state}-permission-store`
            );
            return data;
        })
        .catch(() => {
            libjwt.jwt.logoutAllTabs();
        });
    };
    const fetchPermissions = createFetchPermissionsWatcher(permissionCache);
    return {
        chrome: {
            auth: {
                getOfflineToken: () => libjwt.getOfflineToken(),
                doOffline: () => libjwt.jwt.doOffline(consts.noAuthParam, consts.offlineToken),
                getToken: () => libjwt.jwt.getUserInfo().then(() => libjwt.jwt.getEncodedToken()),
                getUser,
                qe: qe,
                logout: (bounce) => libjwt.jwt.logoutAllTabs(bounce),
                login: () => libjwt.jwt.login()
            },
            isProd: window.location.host === 'cloud.redhat.com',
            isBeta: () => (window.location.pathname.split('/')[1] === 'beta' ? true : false),
            getUserPermissions: (app = '') => getUser().then(() => fetchPermissions(libjwt.jwt.getEncodedToken(), app)),
            isPenTest: () => Cookies.get('x-rh-insights-pentest') ? true : false,
            getBundle: () => getUrl('bundle'),
            getApp: () => getUrl('app'),
            visibilityFunctions,
            init: initFunc
        },
        loadInventory,
        experimental: {
            loadRemediations
        }
    };
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
