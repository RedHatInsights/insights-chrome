import axios from 'axios';
import { ServicesApi } from '@redhat-cloud-services/entitlements-client';
import { deleteLocalStorageItems, lastActive } from '../utils/common';
import { bootstrapCache } from '../utils/cache';

const BASE_PATH = '/api/entitlements/v1';

export default (cachePrefix: string) => {
  const cache = bootstrapCache(BASE_PATH, `${cachePrefix}-entitlements`);

  const instance = axios.create({ adapter: cache.adapter });
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
