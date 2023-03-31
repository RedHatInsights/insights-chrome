import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cookie from 'js-cookie';
import { getFeatureFlagsError, unleashClient } from '../components/FeatureFlags/FeatureFlagsProvider';
import { ITLess, isBeta, isProd } from './common';
import { AxiosRequestConfig } from 'axios';
import { AppNavigationCB, ChromeAuthOptions, GenericCB, NavDOMEvent } from '../@types/types';
import { VisibilityFunctions } from '@redhat-cloud-services/types';
import { Listener } from '@redhat-cloud-services/frontend-components-utilities/MiddlewareListener';
import { APP_NAV_CLICK, GLOBAL_FILTER_UPDATE } from '../redux/action-types';

export const noAuthParam = 'noauth';
export const offlineToken = '2402500adeacc30eb5c5a8a5e2e0ec1f';
export const GLOBAL_FILTER_KEY = 'chrome:global-filter';
export const HYDRA_ENDPOINT = '/hydra/rest/se/sessions';
export const isITLessEnv = ITLess();
/**
 * Keys for storing acess reqeusts data
 */
export const REQUESTS_COUNT = 'chrome:cross-account-requests:pending:count';
export const REQUESTS_DATA = 'chrome:cross-account-requests:pending:data';
export const ACTIVE_ACCOUNT_SWITCH_NOTIFICATION = 'chrome:cross-account-requests:active-notification';
export const ACCOUNT_REQUEST_TIMEOUT = 'chrome:cross-account-requests:request-timeout';
export const CROSS_ACCESS_ACCOUNT_NUMBER = 'cross_access_account_number';
export const ACTIVE_REMOTE_REQUEST = 'chrome/active-remote-request';
export const CROSS_ACCESS_ORG_ID = 'cross_access_org_id';
export const REFRESH_KEY = 'refresh_key';
export const ACCESS_KEY = 'access_key';

const obj = {
  noAuthParam,
  offlineToken,
};

const matcherMapper = {
  isEmpty,
  isNotEmpty: (value: any) => !isEmpty(value),
};

const matchValue = (value: any, matcher?: keyof typeof matcherMapper) => {
  const match = matcherMapper[matcher!];
  return typeof match === 'function' ? match(value) : value;
};

/**
 * Check if is permitted to see navigation link
 * @param {array} permissions array checked user permissions
 * @param {every|some} require type of permissions requirement
 * @returns {boolean}
 */
const checkPermissions = async (permissions: string[] = [], require: 'every' | 'some' = 'every') => {
  const userPermissions = await window.insights.chrome.getUserPermissions();
  return userPermissions && permissions[require]((item) => userPermissions.find(({ permission }) => permission === item));
};

export const visibilityFunctions: VisibilityFunctions = {
  isOrgAdmin: async () => {
    const data = await window.insights.chrome.auth.getUser();
    try {
      return !!data?.identity.user?.is_org_admin;
    } catch {
      return false;
    }
  },
  isActive: async () => {
    const data = await window.insights.chrome.auth.getUser();
    try {
      return !!data?.identity.user?.is_active;
    } catch {
      return false;
    }
  },
  isInternal: async () => {
    const data = await window.insights.chrome.auth.getUser();
    try {
      return !!data?.identity.user?.is_internal;
    } catch {
      return false;
    }
  },
  isEntitled: async (appName?: string) => {
    const data = await window.insights.chrome.auth.getUser();
    const { entitlements } = data || { entitlements: {} };
    return data?.entitlements && appName
      ? Boolean(entitlements[appName] && entitlements[appName].is_entitled)
      : // eslint-disable-next-line camelcase
        Object.entries(entitlements || {}).reduce((acc, [key, { is_entitled }]) => ({ ...acc, [key]: is_entitled }), {});
  },
  isProd: () => isProd(),
  isBeta: () => isBeta(),
  isHidden: () => true, // FIXME: Why always true?
  withEmail: async (...toHave: string[]) => {
    const data = await window.insights.chrome.auth.getUser();
    const {
      identity: { user },
    } = data || { identity: {} };
    return toHave?.some((item) => user?.email?.includes(item));
  },
  loosePermissions: (permissions: string[]) => checkPermissions(permissions, 'some'),
  hasPermissions: checkPermissions,
  hasLocalStorage: (key: string, value: unknown) => localStorage.get(key) === value,
  hasCookie: (cookieKey: string, cookieValue: string) => cookie.get(cookieKey) === cookieValue,
  apiRequest: async ({
    url,
    method = 'GET',
    accessor,
    matcher,
    ...options
  }: Omit<AxiosRequestConfig, 'adapter'> & { accessor?: string; matcher?: keyof typeof matcherMapper }) => {
    const data = await window.insights.chrome.auth.getUser();

    // this will log a bunch of 403s if the account number isn't present
    if (data?.identity.account_number) {
      return instance({
        url,
        method,
        ...options,
      })
        .then((response) => matchValue(accessor ? get(response || {}, accessor) : response, matcher))
        .catch(() => {
          console.log('Unable to retrieve visibility result', { visibilityMethod: 'apiRequest', method, url });
          return false;
        });
    } else {
      console.log('Unable to call API, no account number');
      return false;
    }
  },
  featureFlag: (flagName: string, expectedValue: boolean) => getFeatureFlagsError() !== true && unleashClient?.isEnabled(flagName) === expectedValue,
};

export const isVisible = (limitedApps?: string[], app?: string, visibility?: Record<string, unknown>) => {
  if (limitedApps && app && limitedApps.includes(app)) {
    if (visibility instanceof Object) {
      return Boolean(visibility[app]);
    }

    return visibility;
  }

  return true;
};

export default Object.freeze(obj);

export const activationRequestURLs = [
  'azure-openshift-activation',
  'azure-ocp-activation',
  'azure-oke-activation',
  'azure-opp-activation',
  'azure-ansible-activation',
  'aws-openshift-activation',
  'aws-ocp-activation',
  'aws-oke-activation',
  'aws-opp-activation',
  'gcp-opp-activation',
  'gcp-oke-activation',
  'gcp-ocp-activation',
  'gcp-rhaap2-activation',
  'gcp-rhaap2-ext100-activation',
  'gcp-rhaap2-ext200-activation',
  'gcp-rhaap2-ext400-activation',
];

// Global Defaults

export const defaultAuthOptions: ChromeAuthOptions = {
  realm: 'redhat-external',
  clientId: 'cloud-services',
  cookieName: 'cs_jwt',
};

export const OFFLINE_REDIRECT_STORAGE_KEY = 'chrome.offline.redirectUri';

export const PUBLIC_EVENTS: {
  APP_NAVIGATION: [(callback: AppNavigationCB) => Listener];
  NAVIGATION_TOGGLE: [(callback: GenericCB) => Listener];
  GLOBAL_FILTER_UPDATE: [(callback: GenericCB) => Listener, string];
} = {
  APP_NAVIGATION: [
    (callback: (navEvent: { navId?: string; domEvent: NavDOMEvent }) => void) => {
      const appNavListener: Listener<{ event: NavDOMEvent; id?: string }> = {
        on: APP_NAV_CLICK,
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
      console.error('NAVIGATION_TOGGLE event is deprecated and will be removed in future versions of chrome.');
      return {
        on: 'NAVIGATION_TOGGLE',
        callback,
      };
    },
  ],
  GLOBAL_FILTER_UPDATE: [
    (callback: (...args: unknown[]) => void) => ({
      on: GLOBAL_FILTER_UPDATE,
      callback,
    }),
    'globalFilter.selectedTags',
  ],
};
