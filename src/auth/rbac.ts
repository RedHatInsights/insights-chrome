import axios from 'axios';
import { AccessApi } from '@redhat-cloud-services/rbac-client';
import { setupCache } from 'axios-cache-interceptor';
const BASE_PATH = '/api/rbac/v1';

export default () => {
  const instance = axios.create();
  setupCache(instance);
  instance.interceptors.response.use((response) => response.data || response);

  return new AccessApi(undefined, BASE_PATH, instance as any);
};
