import instance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

const obj = {
  noAuthParam: 'noauth',
  offlineToken: '2402500adeacc30eb5c5a8a5e2e0ec1f',
  allowedUnauthedPaths: ['/', '/logout', '/beta', '/security/insights', '/beta/security/insights'],
};

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
    const { identity } = await insights.chrome.auth.getUser();
    try {
      return identity.user.is_org_admin;
    } catch {
      return false;
    }
  },
  isActive: async () => {
    const { identity } = await insights.chrome.auth.getUser();
    try {
      return identity.user.is_active;
    } catch {
      return false;
    }
  },
  isInternal: async () => {
    const { identity } = await insights.chrome.auth.getUser();
    try {
      return identity.user.is_internal;
    } catch {
      return false;
    }
  },
  isEntitled: async (appName) => {
    const { entitlements } = await insights.chrome.auth.getUser();
    return entitlements && appName
      ? Boolean(entitlements[appName] && entitlements[appName].is_entitled)
      : // eslint-disable-next-line camelcase
        Object.entries(entitlements || {}).reduce((acc, [key, { is_entitled }]) => ({ ...acc, [key]: is_entitled }), {});
  },
  isProd: () => insights.chrome.isProd,
  isBeta: () => insights.chrome.isBeta(),
  loosePermissions: (permissions) => checkPermissions(permissions, 'some'),
  hasPermissions: checkPermissions,
  apiRequest: async ({ url, method, accessor, matcher, ...options }) => {
    return instance({
      url,
      method: method || 'GET',
      ...options,
    })
      .then((response) => matchValue(accessor ? get(response || {}, accessor) : response, matcher))
      .catch((err) => {
        console.log(err);
        return false;
      });
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
