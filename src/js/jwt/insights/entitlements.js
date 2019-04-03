const axios = require('axios');
const { ServicesApi } = require('@redhat-cloud-services/entitlements-client');
const instance = axios.create();
const BASE_PATH = '/api/entitlements/v1';

instance.interceptors.response.use((response) => response.data || response);

const servicesApi = new ServicesApi(undefined, BASE_PATH, instance);

module.exports = servicesApi;
