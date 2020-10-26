import instance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';

const obj = {
  noAuthParam: 'noauth',
  offlineToken: '2402500adeacc30eb5c5a8a5e2e0ec1f',
  allowedUnauthedPaths: ['/', '/logout', '/beta', '/security/insights', '/beta/security/insights'],
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
  hasPermissions: async (permissions = []) => {
    const userPermissions = await insights.chrome.getUserPermissions();
    return userPermissions && permissions.every((item) => userPermissions.find(({ permission }) => permission === item));
  },
  apiRequest: async ({ url, method, ...options }) => {
    // TODO: add caching
    return instance.axios({
      url,
      method: method || 'GET',
      ...options,
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
