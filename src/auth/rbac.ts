import axios from 'axios';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { getPrincipalAccess } from '@redhat-cloud-services/rbac-client';
import { buildMemoryStorage, setupCache } from 'axios-cache-interceptor';
import { VISIBILITY_REQUEST_TIMEOUT_MS } from '../utils/visibilityRequestConfig';
const BASE_PATH = '/api/rbac/v1';

const createRbacAPI = () => {
  const instance = axios.create({ timeout: VISIBILITY_REQUEST_TIMEOUT_MS });
  // Bypass/reset replaces clients: a cleanup interval would retain old stores.
  // Keep isolated, bounded storage; HTTP expiry is still checked on reads.
  setupCache(instance, { storage: buildMemoryStorage(false, false) });

  const AccessApi = APIFactory(BASE_PATH, { getPrincipalAccess }, { axios: instance });
  return AccessApi;
};

export type RbacClient = ReturnType<typeof createRbacAPI>;
export default createRbacAPI;
