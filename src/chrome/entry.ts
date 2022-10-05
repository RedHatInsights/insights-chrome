import { globalFilterScope, registerModule, removeGlobalFilter, toggleGlobalFilter } from '../redux/actions';
import { Listener } from '@redhat-cloud-services/frontend-components-utilities/MiddlewareListener';
import { spinUpStore } from '../redux/redux-config';
import qe from '../utils/iqeEnablement';
import consts, { visibilityFunctions } from '../utils/consts';
import chromeHistory from '../utils/chromeHistory';
import Cookies from 'js-cookie';
import { getEnv, getEnvDetails, getUrl, isBeta, isProd, updateDocumentTitle } from '../utils/common';
import get from 'lodash/get';
import { createSupportCase } from '../js/createCase';
import * as actionTypes from '../redux/action-types';
import { flatTags } from '../js/App/GlobalFilter/globalFilterApi';
import debugFunctions from '../js/debugFunctions';
import { NavDOMEvent } from '../js/App/Sidenav/Navigation/ChromeLink';
import { LibJWT } from '../auth';
import { ChromeAPI, ChromeUser } from '@redhat-cloud-services/types';

type AppNavigationCB = (navEvent: { navId?: string; domEvent: NavDOMEvent }) => void;
type GenericCB = (...args: unknown[]) => void;

const PUBLIC_EVENTS: {
  APP_NAVIGATION: [(callback: AppNavigationCB) => Listener];
  NAVIGATION_TOGGLE: [(callback: GenericCB) => Listener];
  GLOBAL_FILTER_UPDATE: [(callback: GenericCB) => Listener, string];
} = {
  APP_NAVIGATION: [
    (callback: (navEvent: { navId?: string; domEvent: NavDOMEvent }) => void) => {
      const appNavListener: Listener<{ event: NavDOMEvent; id?: string }> = {
        on: actionTypes.APP_NAV_CLICK,
        callback: ({ data }) => {
          if (data.id !== undefined || data.event) {
            callback({ navId: data.id, domEvent: data.event });
          }
        },
      };
      return appNavListener;
    },
  ],
  NAVIGATION_TOGGLE: [
    (callback: (...args: unknown[]) => void) => {
      console.warn('NAVIGATION_TOGGLE event is deprecated and will be removed in future versions of chrome.');
      return {
        on: 'NAVIGATION_TOGGLE',
        callback,
      };
    },
  ],
  GLOBAL_FILTER_UPDATE: [
    (callback: (...args: unknown[]) => void) => ({
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
    appNavClick: ({ secondaryNav, ...payload }: { id?: string; secondaryNav: unknown }) => {
      appNavClick({
        ...payload,
        custom: true,
      });
    },
    appObjectId,
    globalFilterScope: (scope: string) => store.dispatch(globalFilterScope(scope)),
    hideGlobalFilter: (isHidden: boolean) => {
      const initialHash = store.getState()?.chrome?.initialHash;
      /**
       * Restore app URL hash fragment after the global filter is disabled
       */
      if (initialHash) {
        chromeHistory.replace({
          ...chromeHistory.location,
          hash: initialHash,
        });
        store.dispatch({ type: actionTypes.STORE_INITIAL_HASH });
      }
      store.dispatch(toggleGlobalFilter(isHidden));
    },
    identifyApp: (_data: any, appTitle?: string, noSuffix?: boolean) => {
      updateDocumentTitle(appTitle, noSuffix);
      return Promise.resolve();
    },
    mapGlobalFilter: flatTags,
    navigation: () => console.error("Don't use insights.chrome.navigation, it has been deprecated!"),
    on: (type: keyof typeof PUBLIC_EVENTS, callback: AppNavigationCB | GenericCB) => {
      if (!Object.prototype.hasOwnProperty.call(PUBLIC_EVENTS, type)) {
        throw new Error(`Unknown event type: ${type}`);
      }

      const [listener, selector] = PUBLIC_EVENTS[type];
      if (type !== 'APP_NAVIGATION' && typeof selector === 'string') {
        (callback as GenericCB)({
          data: get(store.getState(), selector) || {},
        });
      }
      if (typeof listener === 'function') {
        return middlewareListener.addNew(listener(callback as GenericCB));
      }
    },
    registerModule: (module?: string, manifest?: string) => store.dispatch(registerModule(module, manifest)),
    removeGlobalFilter: (isHidden: boolean) => store.dispatch(removeGlobalFilter(isHidden)),
    updateDocumentTitle,
    $internal: { store },
  };
}

export function bootstrap(
  libjwt: LibJWT,
  initFunc: () => ChromeAPI,
  getUser: () => Promise<ChromeUser | void>,
  globalConfig: { chrome?: { ssoUrl?: string; config?: { ssoUrl?: string } } }
) {
  const { store } = spinUpStore();
  return {
    chrome: {
      auth: {
        getOfflineToken: () => libjwt.getOfflineToken(),
        doOffline: () =>
          libjwt.jwt.doOffline(consts.noAuthParam, consts.offlineToken, globalConfig?.chrome?.ssoUrl || globalConfig?.chrome?.config?.ssoUrl),
        getToken: () => libjwt.initPromise.then(() => libjwt.jwt.getUserInfo().then(() => libjwt.jwt.getEncodedToken())),
        getUser,
        qe: {
          ...qe,
          init: () => qe.init(store),
        },
        logout: (bounce?: boolean) => libjwt.jwt.logoutAllTabs(bounce),
        login: () => libjwt.jwt.login(),
      },
      isProd: () => isProd(),
      isBeta,
      isPenTest: () => (Cookies.get('x-rh-insights-pentest') ? true : false),
      forceDemo: () => Cookies.set('cs_demo', 'true'),
      isDemo: () => (Cookies.get('cs_demo') ? true : false),
      getBundle: () => getUrl('bundle'),
      getApp: () => getUrl('app'),
      getEnvironment: () => getEnv(),
      getEnvironmentDetails: () => getEnvDetails(),
      createCase: (fields?: any) => window.insights.chrome.auth.getUser().then((user) => createSupportCase(user.identity, libjwt, fields)),
      visibilityFunctions,
      init: initFunc,
      isChrome2: true,
      enable: debugFunctions,
      globalConfig,
    },
    experimental: {},
  };
}
