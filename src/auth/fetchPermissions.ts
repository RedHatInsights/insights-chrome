import { Access } from '@redhat-cloud-services/rbac-client/types';
import createRbacAPI from './rbac';
import logger from './logger';
import { ChromeUser } from '@redhat-cloud-services/types';

const log = logger('fetchPermissions.ts');

const perPage = 1000;
const rbacApi = createRbacAPI();

const fetchPermissions = async (_userToken: string, app = '') => {
  try {
    const resp = await rbacApi.getPrincipalAccess({
      limit: perPage,
      application: app,
    });
    /**
     * We have to override the type because of interceptors. They are mutatuing the response.
     * We should come up with a nice pattern to work around the interceptors
     * */
    const { data, meta } = resp.data;
    if (meta && meta.count && meta.count > perPage) {
      return Promise.all(
        [...new Array(Math.ceil(meta.count / perPage))].map((_empty, key) =>
          rbacApi
            .getPrincipalAccess({
              limit: perPage,
              offset: (key + 1) * perPage,
              application: app,
            })
            .then((res) => res.data)
        )
      )
        .then((resp) => resp.map((r) => r.data))
        .then((allAccess) => allAccess.reduce((acc, curr) => [...acc, ...curr], data))
        .catch((error) => log(error));
    } else {
      return data;
    }
  } catch (error) {
    log(error);
  }
};

export const createFetchPermissionsWatcher = (getUser: () => Promise<void | ChromeUser>) => {
  const currentCall: Record<string, void | Access[]> = {};
  return async (userToken: string, app = '', bypassCache?: boolean) => {
    const user = await getUser();
    if (user?.identity && [undefined, -1, '-1'].includes(user.identity.org_id)) {
      return Promise.resolve([]);
    }
    if (typeof currentCall?.[app] === 'undefined' || bypassCache) {
      currentCall[app] = await fetchPermissions(userToken, app);
    }
    return currentCall?.[app] || [];
  };
};
