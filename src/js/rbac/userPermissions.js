const axios = require('axios');
const { bootstrapCache } = require('../utils');

// Gets the source of truth from the CS Config repository, and caches it for 10 minutes.
module.exports = (cachePrefix) => {
    const cache = bootstrapCache('/api/rbac/v1/access/?application=*', `${cachePrefix}-rbac`);

    const instance = axios.create({ adapter: cache.adapter });

    instance.interceptors.response.use((response) => response.data || response);

    // TODO: Make this fetch paginated permissions list as well
    return instance.get(window.location.origin + '/api/rbac/v1/access/?application=*');
};
