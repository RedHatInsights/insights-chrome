const axios = require('axios');
const { ServicesApi } = require('@redhat-cloud-services/entitlements-client');
const { deleteLocalStorageItems, bootstrapCache, lastActive } = require('../../utils');

const BASE_PATH = '/api/entitlements/v1';

module.exports = (cachePrefix) => {
    const cache = bootstrapCache(BASE_PATH, `${cachePrefix}-entitlements`);

    const instance = axios.create({ adapter: cache.adapter });
    instance.interceptors.response.use((response) => {

        if (response && response.request && response.request.fromCache !== true) {
            const last = lastActive('/api/entitlements/v1/services', 'fallback');
            const keys = Object.keys(localStorage).filter(key => key.endsWith('/api/entitlements/v1/services') && key !== last);

            deleteLocalStorageItems(keys);

        }

        return response.data || response;
    });
    return new ServicesApi(undefined, BASE_PATH, instance);
};
