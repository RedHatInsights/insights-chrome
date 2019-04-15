import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { appNavClick } from './redux/actions';
import { spinUpStore } from './redux-config';
import * as actionTypes from './redux/action-types';
import loadInventory from './inventory';
import loadRemediations from './remediations';
import asyncObject from './async-loader';
import qe from './iqeEnablement';

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
    const { identifyApp, appNav, appNavClick, clearActive } = actions;
    libjwt.initPromise.then(() => {
        libjwt.jwt.getUserInfo().then((user) => {
            actions.userLogIn(user);
            loadChrome();
        });
    });

    return {
        identifyApp: (data) => identifyApp(data, store.getState().chrome.globalNav),
        navigation: appNav,
        appNavClick: (payload) => {
            appNavClick(payload);
            clearActive();
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
        },
        async: asyncObject

    };
}

export function bootstrap(libjwt, initFunc) {
    return {
        chrome: {
            auth: {
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
                    return libjwt.initPromise.then(libjwt.jwt.getUserInfo);
                },
                qe: qe,
                logout: libjwt.jwt.logoutAllTabs
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
        },
        async: asyncObject
    };
}

function loadChrome() {
    import('./App/index').then(
        ({ Header, Sidenav }) => {
            const store = insights.chrome.$internal.store;
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
                    <Header />
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
        }
    );
}
