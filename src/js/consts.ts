import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cookie from 'js-cookie';
import { getFeatureFlagsError, unleashClient } from './App/FeatureFlags/FeatureFlagsProvider';
import { isBeta, isProd } from './utils';
import { AxiosRequestConfig } from 'axios';

const obj = {
  noAuthParam: 'noauth',
  offlineToken: '2402500adeacc30eb5c5a8a5e2e0ec1f',
};

export const HYDRA_ENDPOINT = '/hydra/rest/se/sessions';
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

export const visibilityFunctions = {
  isOrgAdmin: async () => {
    const data = await window.insights.chrome.auth.getUser();
    try {
      return !!data.identity.user?.is_org_admin;
    } catch {
      return false;
    }
  },
  isActive: async () => {
    const data = await window.insights.chrome.auth.getUser();
    try {
      return !!data.identity.user?.is_active;
    } catch {
      return false;
    }
  },
  isInternal: async () => {
    const data = await window.insights.chrome.auth.getUser();
    try {
      return !!data.identity.user?.is_internal;
    } catch {
      return false;
    }
  },
  isEntitled: async (appName: string) => {
    const data = await window.insights.chrome.auth.getUser();
    const { entitlements } = data || {};
    return data.entitlements && appName
      ? Boolean(entitlements[appName] && entitlements[appName].is_entitled)
      : // eslint-disable-next-line camelcase
        Object.entries(entitlements || {}).reduce((acc, [key, { is_entitled }]) => ({ ...acc, [key]: is_entitled }), {});
  },
  isProd: () => isProd(),
  isBeta: () => isBeta(),
  isHidden: () => true,
  withEmail: async (...toHave: string[]) => {
    const data = await window.insights.chrome.auth.getUser();
    const {
      identity: { user },
    } = data || {};
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
  }: Omit<AxiosRequestConfig, 'adapter'> & { accessor?: 'string'; matcher?: keyof typeof matcherMapper }) => {
    const data = await window.insights.chrome.auth.getUser();

    // this will log a bunch of 403s if the account number isn't present
    if (data.identity.account_number) {
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
];
