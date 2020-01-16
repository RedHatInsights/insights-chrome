const axios = require('axios');
const log = require('../jwt/logger')('userPermissions.js');

const getAllPermissions = (url, permissions, resolve, reject) => {
    axios.get(url)
    .then(response => {
        const allPermissions = permissions.concat(response.data.data);
        if (response.data.links.next !== null) {
            getAllPermissions(window.location.origin + response.data.links.next, allPermissions, resolve, reject);
        } else {
            resolve(allPermissions);
        }
    })
    .catch(error => {
        log(error);
    });
};

const permissionsInfo = () => {
    return new Promise((resolve, reject) => {
        getAllPermissions(window.location.origin + '/api/rbac/v1/access/?application=*&limit=25', [], resolve, reject);
    });
};

module.exports = () => {
    if (!window.localStorage.getItem('rbac-response') || (Date.now() > JSON.parse(window.localStorage.getItem('rbac-response')).expires)) {
        return permissionsInfo().then((info) => {
            // caching for 10 minutes
            const expTime = Date.now() + 10 * 60 * 1000;
            const data = { expires: expTime, permissions: info };
            window.localStorage.setItem('rbac-response', JSON.stringify(data));
            return data;
        })
        .catch(error => {
            log(error);
        });
    }
    else {
        return new Promise((resolve, reject) => {
            window.localStorage.getItem('rbac-response') ?
                resolve(JSON.parse(window.localStorage.getItem('rbac-response'))) :
                reject('Unable to fetch rbac-response from localStorage');
        });
    }
};
