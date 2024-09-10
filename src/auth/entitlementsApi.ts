import axios from 'axios';
import { ServicesApi } from '@redhat-cloud-services/entitlements-client';
// Once we migrate to axios v1 we can remove this line
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { setupCache } from 'axios-cache-interceptor';
import { deleteLocalStorageItems, lastActive } from '../utils/common';

const BASE_PATH = '/api/entitlements/v1';

export default () => {
  const instance = axios.create();
  setupCache(instance, {});
  instance.interceptors.response.use((response) => {
    if (response && response.request && response.request.fromCache !== true) {
      const last = lastActive('/api/entitlements/v1/services', 'fallback');
      const keys = Object.keys(localStorage).filter((key) => key.endsWith('/api/entitlements/v1/services') && key !== last);

      deleteLocalStorageItems(keys);
    }

    return response.data || response;
  });
  return new ServicesApi(undefined, BASE_PATH, instance as any);
};
