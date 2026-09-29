import axios from 'axios';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { servicesGet } from '@redhat-cloud-services/entitlements-client';
import { setupCache } from 'axios-cache-interceptor';
import { deleteLocalStorageItems, lastActive } from '../utils/common';
import { ENTITLEMENTS_BASE_PATH, ENTITLEMENTS_SERVICES_PATH, ENTITLEMENTS_TIMEOUT_MS } from './entitlementsConstants';

export default () => {
  const instance = axios.create({ timeout: ENTITLEMENTS_TIMEOUT_MS });
  setupCache(instance, {});
  instance.interceptors.response.use((response) => {
    if (response && response.request && response.request.fromCache !== true) {
      const last = lastActive(ENTITLEMENTS_SERVICES_PATH, 'fallback');
      const keys = Object.keys(localStorage).filter((key) => key.endsWith(ENTITLEMENTS_SERVICES_PATH) && key !== last);

      deleteLocalStorageItems(keys);
    }

    return response;
  });
  const ServicesApi = APIFactory(
    ENTITLEMENTS_BASE_PATH,
    {
      servicesGet,
    },
    {
      axios: instance,
    }
  );
  return ServicesApi;
};
