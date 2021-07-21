import { globalFilterScope, toggleGlobalFilter, removeGlobalFilter, registerModule } from '../redux/actions';
import { spinUpStore } from '../redux-config';
import qe from './iqeEnablement';
import consts from '../consts';
import { visibilityFunctions } from '../consts';
import Cookies from 'js-cookie';
import { getUrl, getEnv, isBeta, updateDocumentTitle } from '../utils';
import get from 'lodash/get';
import { createSupportCase } from '../createCase';
import * as actionTypes from '../redux/action-types';
import { flatTags } from '../App/GlobalFilter/constants';
import debugFunctions from '../debugFunctions';

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
    (callback) => {
      console.warn('NAVIGATION_TOGGLE event is deprecated and will be removed in future versions of chrome.');
      return {
        on: 'NAVIGATION_TOGGLE',
        callback,
      };
    },
  ],
  GLOBAL_FILTER_UPDATE: [
    (callback) => ({
      on: actionTypes.GLOBAL_FILTER_UPDATE,
      callback,
    }),
    'globalFilter.selectedTags',
  ],
};

export function chromeInit() {
  const { store, actions, middlewareListener } = spinUpStore();

  // public API actions
  const { appAction, appObjectId, appNavClick } = actions;

  return {
    appAction,
    appNavClick: ({ secondaryNav, ...payload }) => {
      appNavClick({
        ...payload,
        custom: true,
      });
    },
    appObjectId,
    globalFilterScope: (scope) => store.dispatch(globalFilterScope(scope)),
    hideGlobalFilter: (isHidden) => store.dispatch(toggleGlobalFilter(isHidden)),
    identifyApp: (_data, appTitle) => {
      updateDocumentTitle(appTitle);
      return Promise.resolve();
    },
    mapGlobalFilter: flatTags,
    navigation: () => console.error("Don't use insights.chrome.navigation, it has been deprecated!"),
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
    registerModule: (...args) => store.dispatch(registerModule(...args)),
    removeGlobalFilter: (isHidden) => store.dispatch(removeGlobalFilter(isHidden)),
    updateDocumentTitle,
    $internal: { store },
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
      isProd: window.location.host === 'cloud.redhat.com' || window.location.host === 'console.redhat.com',
      isBeta,
      isPenTest: () => (Cookies.get('x-rh-insights-pentest') ? true : false),
      forceDemo: () => Cookies.set('cs_demo', 'true'),
      isDemo: () => (Cookies.get('cs_demo') ? true : false),
      getBundle: () => getUrl('bundle'),
      getApp: () => getUrl('app'),
      getEnvironment: () => getEnv(),
      createCase: (fields) => insights.chrome.auth.getUser().then((user) => createSupportCase(user.identity, fields)),
      visibilityFunctions,
      init: initFunc,
      isChrome2: true,
      enable: debugFunctions,
    },
    experimental: {},
  };
}
