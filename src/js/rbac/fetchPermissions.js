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
    let currentCall = undefined;
    return async (userToken, app = '') => {
        if (insights.chrome.getBundle() === 'openshift') {
            return Promise.resolve([]);
        }
        let permissions;
        permissions = await chromeInstance.cache.getItem('permissions');
        if (permissions) {
            return permissions;
        }
        if (typeof currentCall === 'undefined') {
            currentCall = fetchPermissions(userToken, app).then((data) => {
                currentCall = undefined;
                chromeInstance.cache.setItem('permissions', data);
                return data;
            });
        }
        return currentCall;
    };
};
