import get from 'axios';
const axios = require('axios');
const { setupCache } = require('axios-cache-adapter');
const localforage = require('localforage');

module.exports = (cachePrefix) => {
    const store = localforage.createInstance({
        driver: [
            localforage.LOCALSTORAGE
        ],
        name: `${cachePrefix}-nav`
    });
    const cache = setupCache({
        store,
        maxAge: 10 * 60 * 1000 // 10 minutes
    });

    const instance = axios.create({ adapter: cache.adapter });

    instance.interceptors.response.use((response) => response.data || response);

    return get('https://raw.githubusercontent.com/'
    + 'RedHatInsights/cloud-services-config/master/main.yml');
};
