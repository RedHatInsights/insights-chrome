const axios = require('axios');
const { ServicesApi } = require('@redhat-cloud-services/entitlements-client');
const { setupCache } = require('axios-cache-adapter');

const cache = setupCache({
    maxAge: 5 * 60 * 1000 // 5 minutes
});
const instance = axios.create({
    adapter: cache.adapter
});
const BASE_PATH = '/api/entitlements/v1';

instance.interceptors.response.use((response) => response.data || response);

const servicesApi = new ServicesApi(undefined, BASE_PATH, instance);

module.exports = servicesApi;
