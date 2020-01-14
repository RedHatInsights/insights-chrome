const axios = require('axios');
const { bootstrapCache } = require('../utils');

const getAllPermissions = (url, permissions, resolve, reject) => {
    axios.get(url)
    .then(response => {
        const allPermissions = permissions.concat(response.data.data)
        if(response.data.links.next !== null) {
            getAllPermissions(window.location.origin + response.data.links.next, allPermissions, resolve, reject)
        } else {
            resolve(allPermissions)
        }
    })
    .catch(error => {
        console.log(error)
    })
}

// Gets the source of truth from the CS Config repository, and caches it for 10 minutes.
module.exports = (cachePrefix) => {
    const cache = bootstrapCache('/api/rbac/v1/access/?application=*', `${cachePrefix}-rbac`);

    const instance = axios.create({ adapter: cache.adapter });

    instance.interceptors.response.use((response) => response.data || response);

    return new Promise((resolve, reject) => {
        getAllPermissions(window.location.origin + '/api/rbac/v1/access/?application=*', [], resolve, reject)
    })
};
