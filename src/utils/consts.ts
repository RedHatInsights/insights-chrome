import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cookie from 'js-cookie';
import { getFeatureFlagsError, unleashClient } from '../components/FeatureFlags/FeatureFlagsProvider';
import { isBeta, isProd } from './common';
import { AxiosRequestConfig } from 'axios';
import { ChromeAuthOptions } from '../@types/types';

export const noAuthParam = 'noauth';
export const offlineToken = '2402500adeacc30eb5c5a8a5e2e0ec1f';
export const GLOBAL_FILTER_KEY = 'chrome:global-filter';
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
  'gcp-opp-activation',
  'gcp-oke-activation',
  'gcp-ocp-activation',
  'gcp-rhaap2-activation',
  'gcp-rhaap2-ext100-activation',
  'gcp-rhaap2-ext200-activation',
  'gcp-rhaap2-ext400-activation'
];

// Global Defaults

export const DEFAULT_SSO_ROUTES = {
  prod: {
    url: ['access.redhat.com', 'prod.foo.redhat.com', 'cloud.redhat.com', 'console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  qa: {
    url: ['qa.foo.redhat.com', 'qa.cloud.redhat.com', 'qa.console.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
    portal: 'https://access.qa.redhat.com',
  },
  ci: {
    url: ['ci.foo.redhat.com', 'ci.cloud.redhat.com', 'ci.console.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
    portal: 'https://access.qa.redhat.com',
  },
  qaprodauth: {
    url: ['qaprodauth.foo.redhat.com', 'qaprodauth.cloud.redhat.com', 'qaprodauth.console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  stage: {
    url: ['stage.foo.redhat.com', 'cloud.stage.redhat.com', 'console.stage.redhat.com', 'fetest.stage.redhat.com'],
    sso: 'https://sso.stage.redhat.com/auth',
    portal: 'https://access.stage.redhat.com',
  },
  gov: {
    url: ['gov.cloud.redhat.com', 'gov.console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  govStage: {
    url: ['gov.cloud.stage.redhat.com', 'gov.console.stage.redhat.com'],
    sso: 'https://sso.stage.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  dev: {
    url: ['console.dev.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
};

export const defaultAuthOptions: ChromeAuthOptions = {
  realm: 'redhat-external',
  clientId: 'cloud-services',
  cookieName: 'cs_jwt',
};

export const OFFLINE_REDIRECT_STORAGE_KEY = 'chrome.offline.redirectUri';
