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

module.exports = (cachePrefix) => {
    if(window.localStorage){
        rbacStore = Object.keys(window.localStorage).filter(key => key.includes('-rbac-response'))
        if(rbacStore.length < 1 || ( Date.now() > JSON.parse(window.localStorage.getItem(rbacStore[0]).expires ))) {
            rbacResponse = new Promise((resolve, reject) => {
                getAllPermissions(window.location.origin + '/api/rbac/v1/access/?application=*', [], resolve, reject)
            })
            rbacResponse.then((response) => {
                expTime = Date.now() + 10 * 60 * 1000
                window.localStorage.removeItem(rbacStore[0])
                window.localStorage.setItem(`${cachePrefix}-rbac-response`,
                JSON.stringify({ expires: expTime, permissions: response }));
                console.log(response);
                return response
            });
        }
        return JSON.parse(window.localStorage.getItem(rbacStore[0].permissions)).permissions
    }

};
