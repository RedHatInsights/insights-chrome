const axios = require('axios');
const { ServicesApi } = require('@redhat-cloud-services/entitlements-client');
const { bootstrapCache } = require('../../utils');
const BASE_PATH = '/api/entitlements/v1';

module.exports = (cachePrefix) => {
    const cache = bootstrapCache(BASE_PATH, `${cachePrefix}-entitlements`);

    const instance = axios.create({ adapter: cache.adapter });
    instance.interceptors.response.use((response) => response.data || response);

    return new ServicesApi(undefined, BASE_PATH, instance);
};
