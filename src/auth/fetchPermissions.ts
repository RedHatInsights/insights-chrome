import { Access, AccessPagination } from '@redhat-cloud-services/rbac-client';
import createRbacAPI from './rbac';
import logger from '../jwt/logger';

const log = logger('fetchPermissions.ts');

const perPage = 1000;

const fetchPermissions = (userToken: string, app = '') => {
  const rbacApi = createRbacAPI(userToken);
  return rbacApi
    .getPrincipalAccess(app, undefined, undefined, perPage)
    .then((resp) => {
      /**
       * We have to override the type because of interceptors. They are mutatuing the response.
       * We should come up with a nice pattern to work around the interceptors
       * */
      const { data, meta } = resp as unknown as Required<AccessPagination>;
      if (meta.count! > perPage) {
        return Promise.all(
          [...new Array(Math.ceil(meta.count! / perPage))].map((_empty, key) =>
            rbacApi
              .getPrincipalAccess(app, undefined, undefined, perPage, (key + 1) * perPage)
              .then(({ data }) => data as unknown as AccessPagination['data'])
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
  const currentCall: Record<string, void | Access[]> = {};
  return async (userToken: string, app = '', bypassCache?: boolean) => {
    const user = await window.insights.chrome.auth.getUser();
    if (user?.identity && [undefined, -1, '-1'].includes(user.identity.account_number)) {
      return Promise.resolve([]);
    }
    if (typeof currentCall?.[app] === 'undefined' || bypassCache) {
      currentCall[app] = await fetchPermissions(userToken, app);
    }
    return currentCall?.[app] || [];
  };
};
