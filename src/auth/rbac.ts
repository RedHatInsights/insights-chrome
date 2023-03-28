import axios from 'axios';
import { AccessApi } from '@redhat-cloud-services/rbac-client';
import { bootstrapCache } from '../utils/cache';
const BASE_PATH = '/api/rbac/v1';

export default (cachePrefix: string) => {
  const cache = bootstrapCache(BASE_PATH, `${cachePrefix}-rbac`);

  const instance = axios.create({ adapter: cache.adapter });
  instance.interceptors.response.use((response) => response.data || response);

  return new AccessApi(undefined, BASE_PATH, instance as any);
};
