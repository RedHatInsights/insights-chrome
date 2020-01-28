import createRbacAPI from './rbac.js';
const log = require('../jwt/logger')('fetchPermissions.js');

const perPage = 25;

export const fetchPermissions = (userToken) => {
    const rbacApi = createRbacAPI(userToken);
    return rbacApi.getPrincipalAccess('*', undefined, perPage).then(({ data, meta }) => {
        if (meta.count > perPage) {
            return Promise.all(
                [...new Array(Math.ceil(meta.count / perPage))]
                .map((_empty, key) => rbacApi.getPrincipalAccess('*', undefined, perPage, (key + 1) * perPage)
                .then(({ data }) => data))
            ).then(allAccess => allAccess.reduce((acc, curr) => ([...acc, ...curr]), data))
            .catch(error => log(error));
        } else {
            return data;
        }})
    .catch(error => log(error));
};
