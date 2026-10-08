import axios from 'axios';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { getPrincipalAccess } from '@redhat-cloud-services/rbac-client';
import { setupCache } from 'axios-cache-interceptor';
import { VISIBILITY_REQUEST_TIMEOUT_MS } from '../utils/visibilityRequestConfig';
const BASE_PATH = '/api/rbac/v1';

export default () => {
  const instance = axios.create({ timeout: VISIBILITY_REQUEST_TIMEOUT_MS });
  setupCache(instance);

  const AccessApi = APIFactory(BASE_PATH, { getPrincipalAccess }, { axios: instance });
  return AccessApi;
};
