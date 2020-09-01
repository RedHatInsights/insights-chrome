const axios = require('axios');
const { deleteLocalStorageItems, bootstrapCache, lastActive } = require('../utils');

// Gets the source of truth from the CS Config repository, and caches it for 10 minutes.
module.exports = (cachePrefix) => {
    const cache = bootstrapCache('/config/main.yml', `${cachePrefix}-nav`);
    const instance = axios.create({ adapter: cache.adapter });
    instance.interceptors.response.use((response) => {
        if (response && response.request && response.request.fromCache !== true) {
            const last = lastActive('/config/main.yml', 'fallback');
            const keys = Object.keys(localStorage).filter(key => key.endsWith('config/main.yml') && key !== last);
            deleteLocalStorageItems(keys);
        }

        return response.data || response;
    });
    // Add prefix (/beta) depending on environment
    let prefix = '';
    if (window.location.pathname.indexOf('/beta') !== -1) {
        prefix = '/beta';
    }

    return instance.get(window.location.origin + prefix + '/config/main.yml');
};
