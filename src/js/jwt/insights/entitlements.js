const axios = require('axios');
const { ServicesApi } = require('@redhat-cloud-services/entitlements-client');
const { setupCache } = require('axios-cache-adapter');
const localforage = require('localforage');
const { deleteLocalStorageItems } = require('../../utils');
const BASE_PATH = '/api/entitlements/v1';

module.exports = (cachePrefix) => {
    const store = localforage.createInstance({
        driver: [
            localforage.LOCALSTORAGE
        ],
        name: `${cachePrefix}-entitlements`
    });
    const cache = setupCache({
        store,
        maxAge: 10 * 60 * 1000 // 10 minutes
    });

    const instance = axios.create({ adapter: cache.adapter });
    instance.interceptors.response.use((response) => {
        if (response && response.request && response.request.fromCache !== true) {
            const keys = Object.keys(localStorage).filter(key => key.endsWith('/api/entitlements/v1/services')).slice(0, -1);
            deleteLocalStorageItems(keys);
        }

        return response;
    });
    instance.interceptors.response.use((response) => response.data || response);

    return new ServicesApi(undefined, BASE_PATH, instance);
};
