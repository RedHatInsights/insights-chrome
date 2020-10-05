import createRbacAPI from './rbac.js';
import logger from '../jwt/logger';

const log = logger('fetchPermissions.js');

const perPage = 100;

const fetchPermissions = (userToken, app = '') => {
    const rbacApi = createRbacAPI(userToken);
    return rbacApi.getPrincipalAccess(app, undefined, perPage).then(({ data, meta }) => {
        if (meta.count > perPage) {
            return Promise.all(
                [...new Array(Math.ceil(meta.count / perPage))]
                .map((_empty, key) => rbacApi.getPrincipalAccess(app, undefined, perPage, (key + 1) * perPage)
                .then(({ data }) => data))
            ).then(allAccess => allAccess.reduce((acc, curr) => ([...acc, ...curr]), data))
            .catch(error => log(error));
        } else {
            return data;
        }})
    .catch(error => log(error));
};

export const createFetchPermissionsWatcher = (chromeInstance) => {
    let currentCall = {};
    return async (userToken, app = '', bypassCache = false) => {
        if (insights.chrome.getBundle() === 'openshift') {
            return Promise.resolve([]);
        }
        if (bypassCache) {
            const data = await fetchPermissions(userToken, app);
            chromeInstance.cache.setItem('permissions', undefined);
            return data;
        }
        let permissions;
        permissions = await chromeInstance.cache.getItem('permissions');
        if (permissions?.[app]) {
            return permissions?.[app];
        }
        if (typeof currentCall?.[app] === 'undefined') {
            currentCall[app] = await fetchPermissions(userToken, app);
            chromeInstance.cache.setItem('permissions', {
                ...permissions || {},
                [app]: currentCall[app]
            });
        }
        return currentCall?.[app];
    };
};
