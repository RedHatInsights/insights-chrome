
const axios = require('axios');
const { setupCache } = require('axios-cache-adapter');
const localforage = require('localforage');

// Gets the source of truth from the CS Config repository, and caches it for 10 minutes.
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

    // Add prefix (/beta) depending on environment
    let prefix = '';
    if (window.location.pathname.indexOf('/beta') !== -1) {
        prefix = '/beta';
    }

    if (prefix.length >= 0) {
        return instance.get('https://raw.githubusercontent.com/RedHatInsights/cloud-services-config/ci-stable/main.yml');
    }

    //return instance.get(window.location.origin + prefix + '/config/main.yml');
    return instance.get('https://raw.githubusercontent.com/RedHatInsights/cloud-services-config/ci-stable/main.yml');
};
