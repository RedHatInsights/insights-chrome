import { createFetchPermissionsWatcher } from '../auth/fetchPermissions';
import { AddChromeWsEventListener, AppNavigationCB, ChromeAPI, GenericCB } from '@redhat-cloud-services/types';
import { Store } from 'redux';
import { AnalyticsBrowser } from '@segment/analytics-next';
import get from 'lodash/get';
import Cookies from 'js-cookie';

import { globalFilterScope, removeGlobalFilter, toggleGlobalFilter } from '../redux/actions';
import { ITLess, getEnv, getEnvDetails, isProd, updateDocumentTitle } from '../utils/common';
import { createSupportCase } from '../utils/createCase';
import debugFunctions from '../utils/debugFunctions';
import { flatTags } from '../components/GlobalFilter/globalFilterApi';
import { PUBLIC_EVENTS } from '../utils/consts';
import { middlewareListener } from '../redux/redux-config';
import { clearAnsibleTrialFlag, isAnsibleTrialFlagActive, setAnsibleTrialFlag } from '../utils/isAnsibleTrialFlagActive';
import chromeHistory from '../utils/chromeHistory';
import { ReduxState } from '../redux/store';
import { FlagTagsFilter } from '../@types/types';
import useBundle, { bundleMapping, getUrl } from '../hooks/useBundle';
import { warnDuplicatePkg } from './warnDuplicatePackages';
import { getVisibilityFunctions } from '../utils/VisibilitySingleton';
import { ChromeAuthContextValue } from '../auth/ChromeAuthContext';
import qe from '../utils/iqeEnablement';
import { RegisterModulePayload } from '../state/atoms/chromeModuleAtom';
import requestPdf from '../pdf/requestPdf';
import chromeStore from '../state/chromeStore';
import { isFeedbackModalOpenAtom } from '../state/atoms/feedbackModalAtom';
import { usePendoFeedback } from '../components/Feedback';
import { NavListener, activeAppAtom } from '../state/atoms/activeAppAtom';
import { isDebuggerEnabledAtom } from '../state/atoms/debuggerModalatom';
import { appActionAtom, pageObjectIdAtom } from '../state/atoms/pageAtom';

export type CreateChromeContextConfig = {
  useGlobalFilter: (callback: (selectedTags?: FlagTagsFilter) => any) => ReturnType<typeof callback>;
  store: Store<ReduxState>;
  setPageMetadata: (pageOptions: any) => any;
  analytics: AnalyticsBrowser;
  quickstartsAPI: ChromeAPI['quickStarts'];
  helpTopics: ChromeAPI['helpTopics'];
  chromeAuth: ChromeAuthContextValue;
  registerModule: (payload: RegisterModulePayload) => void;
  isPreview: boolean;
  addNavListener: (cb: NavListener) => number;
  deleteNavListener: (id: number) => void;
  addWsEventListener: AddChromeWsEventListener;
};

export const createChromeContext = ({
  useGlobalFilter,
  store,
  setPageMetadata,
  analytics,
  quickstartsAPI,
  helpTopics,
  registerModule,
  chromeAuth,
  isPreview,
  addNavListener,
  deleteNavListener,
  addWsEventListener,
}: CreateChromeContextConfig): ChromeAPI => {
  const fetchPermissions = createFetchPermissionsWatcher(chromeAuth.getUser);
  const visibilityFunctions = getVisibilityFunctions();
  const dispatch = store.dispatch;
  const actions = {
    appAction: (action: string) => chromeStore.set(appActionAtom, action),
    appObjectId: (objectId: string) => chromeStore.set(pageObjectIdAtom, objectId),
    appNavClick: (item: string) => chromeStore.set(activeAppAtom, item),
    globalFilterScope: (scope: string) => dispatch(globalFilterScope(scope)),
    registerModule: (module: string, manifest?: string) => registerModule({ module, manifest }),
    removeGlobalFilter: (isHidden: boolean) => {
      console.error('`removeGlobalFilter` is deprecated. Use `hideGlobalFilter` instead.');
      return dispatch(removeGlobalFilter(isHidden));
    },
  };

  const on = (type: keyof typeof PUBLIC_EVENTS | 'APP_NAVIGATION', callback: AppNavigationCB | GenericCB) => {
    if (type === 'APP_NAVIGATION') {
      const listenerId = addNavListener(callback);
      return () => deleteNavListener(listenerId);
    }
    if (!Object.prototype.hasOwnProperty.call(PUBLIC_EVENTS, type)) {
      throw new Error(`Unknown event type: ${type}`);
    }

    const [listener, selector] = PUBLIC_EVENTS[type];
    if (typeof selector === 'string') {
      (callback as GenericCB)({
        data: get(store.getState(), selector) || {},
      });
    }
    if (typeof listener === 'function') {
      return middlewareListener.addNew(listener(callback as GenericCB));
    }
  };

  const identifyApp = (_data: any, appTitle?: string, noSuffix?: boolean) => {
    updateDocumentTitle(appTitle, noSuffix);
    return Promise.resolve();
  };

  const isITLessEnv = ITLess();

  const api: ChromeAPI = {
    ...actions,
    addWsEventListener,
    auth: {
      getRefreshToken: chromeAuth.getRefreshToken,
      getToken: chromeAuth.getToken,
      getUser: chromeAuth.getUser,
      logout: chromeAuth.logout,
      login: chromeAuth.login,
      doOffline: chromeAuth.doOffline,
      getOfflineToken: chromeAuth.getOfflineToken,
      qe: {
        ...qe,
        init: () => qe.init(chromeStore, { current: { user: { access_token: chromeAuth.token } } as any }),
      },
      reAuthWithScopes: chromeAuth.reAuthWithScopes,
    },
    initialized: true,
    isProd,
    forceDemo: () => Cookies.set('cs_demo', 'true'),
    getBundle: () => getUrl('bundle'),
    getBundleData: useBundle,
    getApp: () => getUrl('app'),
    getEnvironment: () => getEnv(),
    getEnvironmentDetails: () => {
      let environment = getEnvDetails();
      if (environment && chromeAuth.ssoUrl) {
        environment.sso = chromeAuth.ssoUrl;
      } else {
        environment = {
          url: [],
          portal: 'undefined',
          sso: chromeAuth.ssoUrl,
        };
      }
      return environment;
    },
    getAvailableBundles: () => Object.entries(bundleMapping).map(([key, value]) => ({ id: key, title: value })),
    createCase: (options?: any) => chromeAuth.getUser().then((user) => createSupportCase(user!.identity, chromeAuth.token, options)),
    getUserPermissions: async (app = '', bypassCache?: boolean) => {
      const token = await chromeAuth.getToken();
      return fetchPermissions(token, app, bypassCache);
    },
    identifyApp,
    hideGlobalFilter: (isHidden: boolean) => {
      dispatch(toggleGlobalFilter(isHidden));
    },
    isBeta: () => isPreview,
    isChrome2: true,
    enable: debugFunctions,
    isDemo: () => Boolean(Cookies.get('cs_demo')),
    isPenTest: () => Boolean(Cookies.get('x-rh-insights-pentest')),
    mapGlobalFilter: flatTags,
    navigation: () => console.error("Don't use insights.chrome.navigation, it has been deprecated!"),
    updateDocumentTitle,
    visibilityFunctions,
    on,
    experimentalApi: true,
    isFedramp: isITLessEnv,
    usePendoFeedback,
    segment: {
      setPageMetadata,
    },
    toggleFeedbackModal: (isOpen: boolean) => {
      chromeStore.set(isFeedbackModalOpenAtom, isOpen);
    },
    enableDebugging: () => {
      chromeStore.set(isDebuggerEnabledAtom, true);
    },
    toggleDebuggerModal: (isOpen: boolean) => {
      chromeStore.set(isDebuggerEnabledAtom, isOpen);
    },
    // FIXME: Update types once merged
    quickStarts: quickstartsAPI as unknown as ChromeAPI['quickStarts'],
    helpTopics,
    clearAnsibleTrialFlag,
    isAnsibleTrialFlagActive,
    setAnsibleTrialFlag,
    // FIXME: get rid of these anys
    chromeHistory: chromeHistory as any,
    analytics: analytics! as any,
    // FIXME: Update types once merged
    useGlobalFilter: useGlobalFilter as unknown as ChromeAPI['useGlobalFilter'],
    init: () => {
      console.error(
        `Calling deprecated "chrome.init function"! Please remove the function call from your code. Functions "on" and "updateDocumentTitle" are directly accessible from "useChrome" hook.`
      );
      return {
        on,
        updateDocumentTitle,
        identifyApp,
      };
    },
    $internal: {
      store,
      // Not supposed to be used by tenants
      forceAuthRefresh: chromeAuth.forceRefresh,
    },
    enablePackagesDebug: () => warnDuplicatePkg(),
    requestPdf,
  };
  return api;
};
