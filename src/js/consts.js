import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cookie from 'js-cookie';

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

const matcherMapper = {
  isEmpty,
  isNotEmpty: (value) => !isEmpty(value),
};
/**
 * returns true/false if value matches required criteria. If invalid or no matcher is provided it returns the original value.
 * @param {any} value variable to be matched with matcher function
 * @param {string} matcher id of matcher
 */
const matchValue = (value, matcher) => {
  const match = matcherMapper[matcher];
  return typeof match === 'function' ? match(value) : value;
};

/**
 * Check if is permitted to see navigation link
 * @param {array} permissions array checked user permissions
 * @param {every|some} require type of permissions requirement
 * @returns {boolean}
 */
const checkPermissions = async (permissions = [], require = 'every') => {
  const userPermissions = await insights.chrome.getUserPermissions();
  return userPermissions && permissions[require]((item) => userPermissions.find(({ permission }) => permission === item));
};

export const visibilityFunctions = {
  isOrgAdmin: async () => {
    const data = await insights.chrome.auth.getUser();
    try {
      return data.identity.user.is_org_admin;
    } catch {
      return false;
    }
  },
  isActive: async () => {
    const data = await insights.chrome.auth.getUser();
    try {
      return data.identity.user.is_active;
    } catch {
      return false;
    }
  },
  isInternal: async () => {
    const data = await insights.chrome.auth.getUser();
    try {
      return data.identity.user.is_internal;
    } catch {
      return false;
    }
  },
  isEntitled: async (appName) => {
    const data = await insights.chrome.auth.getUser();
    const { entitlements } = data || {};
    return data.entitlements && appName
      ? Boolean(entitlements[appName] && entitlements[appName].is_entitled)
      : // eslint-disable-next-line camelcase
        Object.entries(entitlements || {}).reduce((acc, [key, { is_entitled }]) => ({ ...acc, [key]: is_entitled }), {});
  },
  isProd: () => insights.chrome.isProd,
  isBeta: () => insights.chrome.isBeta(),
  isHidden: () => true,
  withEmail: async (toHave) => {
    const data = await insights.chrome.auth.getUser();
    const {
      identity: { user },
    } = data || {};
    return user?.email?.includes(toHave);
  },
  loosePermissions: (permissions) => checkPermissions(permissions, 'some'),
  hasPermissions: checkPermissions,
  hasLocalStorage: (key, value) => localStorage.get(key) === value,
  hasCookie: (cookieKey, cookieValue) => cookie.get(cookieKey) === cookieValue,
  apiRequest: async ({ url, method = 'GET', accessor, matcher, ...options }) => {
    const data = await insights.chrome.auth.getUser();

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
};

export const isVisible = (limitedApps, app, visibility) => {
  if (limitedApps && limitedApps.includes(app)) {
    if (visibility instanceof Object) {
      return Boolean(visibility[app]);
    }

    return visibility;
  }

  return true;
};

export default Object.freeze(obj);
