import axios from 'axios';
import { AccessApi } from '@redhat-cloud-services/rbac-client';
const BASE_PATH = '/api/rbac/v1';

export default () => {
  const instance = axios.create();
  instance.interceptors.response.use((response) => response.data || response);

  return new AccessApi(undefined, BASE_PATH, instance as any);
};
