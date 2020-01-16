import instance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';

const obj =  {
    noAuthParam: 'noauth',
    offlineToken: '2402500adeacc30eb5c5a8a5e2e0ec1f',
    allowedUnauthedPaths: ['/', '/logout', '/beta']
};

export const visibilityFunctions = {
    isOrgAdmin: async () => {
        const { identity } = await insights.chrome.auth.getUser();
        return identity.user.is_org_admin;
    },
    isActive: async () => {
        const { identity } = await insights.chrome.auth.getUser();
        return identity.user.is_active;
    },
    isInternal: async () => {
        const { identity } = await insights.chrome.auth.getUser();
        return identity.user.is_internal;
    },
    isEntitled: async (appName) => {
        const { entitlements } = await insights.chrome.auth.getUser();
        return appName ? Boolean(entitlements[appName] && entitlements[appName].is_entitled) :
            // eslint-disable-next-line camelcase
            Object.entries(entitlements).reduce((acc, [key, { is_entitled }]) => ({ ...acc, [key]: is_entitled }), {});
    },
    isProd: () => {
        return insights.chrome.isProd;
    },
    isBeta: () => {
        return insights.chrome.isBeta();
    },
    apiRequest: async ({ url, method, ...props }) => {
        // TODO: add caching
        return instance.axios({
            url,
            method: method || 'GET',
            ...props
        });
    }
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
