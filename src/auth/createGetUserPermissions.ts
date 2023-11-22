import { ChromeUser } from '@redhat-cloud-services/types';
import { createFetchPermissionsWatcher } from './fetchPermissions';

export default function createGetUserPermissions(getUser: () => Promise<ChromeUser>, getToken: () => Promise<string>) {
  const fetchPermissions = createFetchPermissionsWatcher(getUser);
  return async (app = '', bypassCache?: boolean) => {
    const token = await getToken();
    return fetchPermissions(token || '', app, bypassCache);
  };
}
