const axios = require('axios');
const { bootstrapCache } = require('../utils');

// Gets the source of truth from the CS Config repository, and caches it for 10 minutes.
module.exports = (cachePrefix) => {
    const cache = bootstrapCache('/config/main.yml', `${cachePrefix}-nav`);

    const instance = axios.create({ adapter: cache.adapter });

    instance.interceptors.response.use((response) => response.data || response);

    // Add prefix (/beta) depending on environment
    let prefix = '';
    if (window.location.pathname.indexOf('/beta') !== -1) {
        prefix = '/beta';
    }

    return instance.get(window.location.origin + prefix + '/config/main.yml');
};
