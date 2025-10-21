import axios from 'axios';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { servicesGet } from '@redhat-cloud-services/entitlements-client';
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

    return response;
  });
  const ServicesApi = APIFactory(
    BASE_PATH,
    {
      servicesGet,
    },
    {
      axios: instance,
    }
  );
  return ServicesApi;
};
