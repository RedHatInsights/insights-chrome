const axios = require('axios');
const { AccessApi } = require('@redhat-cloud-services/rbac-client');
const { bootstrapCache } = require('../utils');
const BASE_PATH = '/api/rbac/v1';

module.exports = (cachePrefix) => {
    const cache = bootstrapCache(BASE_PATH, `${cachePrefix}-rbac`);

    const instance = axios.create({ adapter: cache.adapter });
    instance.interceptors.response.use((response) => response.data || response);

    return new AccessApi(undefined, BASE_PATH, instance);
};
