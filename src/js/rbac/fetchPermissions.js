import createRbacAPI from './rbac.js';
import logger from '../jwt/logger';

const log = logger('fetchPermissions.js');

const perPage = 100;

const fetchPermissions = (userToken, app = '') => {
  const rbacApi = createRbacAPI(userToken);
  return rbacApi
    .getPrincipalAccess(app, undefined, perPage)
    .then(({ data, meta }) => {
      if (meta.count > perPage) {
        return Promise.all(
          [...new Array(Math.ceil(meta.count / perPage))].map((_empty, key) =>
            rbacApi.getPrincipalAccess(app, undefined, perPage, (key + 1) * perPage).then(({ data }) => data)
          )
        )
          .then((allAccess) => allAccess.reduce((acc, curr) => [...acc, ...curr], data))
          .catch((error) => log(error));
      } else {
        return data;
      }
    })
    .catch((error) => log(error));
};

export const createFetchPermissionsWatcher = () => {
  let currentCall = {};
  return async (userToken, app = '') => {
    const user = await insights.chrome.auth.getUser();
    if (user?.identity && [undefined, -1].includes(user.identity.account_number)) {
      return Promise.resolve([]);
    }
    if (typeof currentCall?.[app] === 'undefined') {
      currentCall[app] = await fetchPermissions(userToken, app);
    }
    return currentCall?.[app];
  };
};
