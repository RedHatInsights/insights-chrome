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

export const createFetchPermissionsWatcher = (cache) => {
    let currentCall = undefined;
    return async (userToken, app = '') => {
        if (insights.chrome.getBundle() === 'openshift') {
            return Promise.resolve([]);
        }
        let permissions;
        try {
            permissions = await cache.getItem('permissions');
            if (permissions) {
                return permissions;
            }
        } catch (_error) {
            // ignore error and get permissions from promise
        }
        if (typeof currentCall === 'undefined') {
            currentCall = fetchPermissions(userToken, app).then((data) => {
                currentCall = undefined;
                try {
                    cache.setItem('permissions', data);
                } catch (_error) {
                    // ignore error and do not set cache
                }
                return data;
            });
        }
        return currentCall;
    };
};
