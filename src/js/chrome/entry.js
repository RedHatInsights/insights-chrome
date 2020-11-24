import React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { globalFilterScope, toggleGlobalFilter } from '../redux/actions';
import { spinUpStore } from '../redux-config';
import loadInventory from '../inventory/index';
import loadRemediations from '../remediations';
import qe from './iqeEnablement';
import consts from '../consts';
import RootApp from '../App/RootApp';
import { visibilityFunctions } from '../consts';
import Cookies from 'js-cookie';
import { getUrl } from '../utils';
import get from 'lodash/get';
import { createSupportCase } from '../createCase';
import * as actionTypes from '../redux/action-types';
import { flatTags } from '../App/GlobalFilter/constants';

const PUBLIC_EVENTS = {
  APP_NAVIGATION: [
    (fn) => ({
      on: actionTypes.APP_NAV_CLICK,
      callback: ({ data }) => {
        if (data.id !== undefined || data.event) {
          fn({ navId: data.id, domEvent: data.event });
        }
      },
    }),
  ],
  NAVIGATION_TOGGLE: [
    (callback) => ({
      on: actionTypes.NAVIGATION_TOGGLE,
      callback,
    }),
  ],
  GLOBAL_FILTER_UPDATE: [
    (callback) => ({
      on: actionTypes.GLOBAL_FILTER_UPDATE,
      callback,
    }),
    'globalFilter.selectedTags',
  ],
};

export function chromeInit(navResolver) {
  const { store, actions, middlewareListener } = spinUpStore();

  // public API actions
  const { identifyApp, appAction, appObjectId, clearActive, appNavClick } = actions;

  return {
    identifyApp: (data) => navResolver.then(() => identifyApp(data, store.getState().chrome.globalNav)),
    navigation: () => console.error("Don't use insights.chrome.navigation, it has been deprecated!"),
    appAction,
    appObjectId,
    hideGlobalFilter: (isHidden) => store.dispatch(toggleGlobalFilter(isHidden)),
    globalFilterScope: (scope) => store.dispatch(globalFilterScope(scope)),
    mapGlobalFilter: flatTags,
    appNavClick: ({ secondaryNav, ...payload }) => {
      if (!secondaryNav) {
        clearActive();
      }

      appNavClick({
        ...payload,
        custom: true,
      });
    },
    on: (type, callback) => {
      if (!Object.prototype.hasOwnProperty.call(PUBLIC_EVENTS, type)) {
        throw new Error(`Unknown event type: ${type}`);
      }

      const [listener, selector] = PUBLIC_EVENTS[type];
      if (selector) {
        callback({
          data: get(store.getState(), selector) || {},
        });
      }
      return middlewareListener.addNew(listener(callback));
    },
  };
}

export function bootstrap(libjwt, initFunc, getUser) {
  return {
    chrome: {
      auth: {
        getOfflineToken: () => libjwt.getOfflineToken(),
        doOffline: () => libjwt.jwt.doOffline(consts.noAuthParam, consts.offlineToken),
        getToken: () => libjwt.jwt.getUserInfo().then(() => libjwt.jwt.getEncodedToken()),
        getUser,
        qe: qe,
        logout: (bounce) => libjwt.jwt.logoutAllTabs(bounce),
        login: () => libjwt.jwt.login(),
      },
      isProd: window.location.host === 'cloud.redhat.com',
      isBeta: () => (window.location.pathname.split('/')[1] === 'beta' ? true : false),
      isPenTest: () => (Cookies.get('x-rh-insights-pentest') ? true : false),
      getBundle: () => getUrl('bundle'),
      getApp: () => getUrl('app'),
      createCase: (fields) => insights.chrome.auth.getUser().then((user) => createSupportCase(user.identity, fields)),
      visibilityFunctions,
      init: initFunc,
    },
    loadInventory,
    experimental: {
      loadRemediations,
    },
  };
}

const App = () => {
  const config = {
    advisor: {
      name: 'advisor',
      manifestLocation: `${window.location.origin}/apps/advisor/fed-mods.json`,
    },
  };
  return <RootApp config={config} />;
};

export function rootApp() {
  const { store } = spinUpStore();
  const pageRoot = document.querySelector('.pf-c-page__drawer');
  if (pageRoot) {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      pageRoot
    );
  }
}
