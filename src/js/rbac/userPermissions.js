const axios = require('axios');

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

const permissionsInfo = () => {
    return new Promise((resolve, reject) => {
        getAllPermissions(window.location.origin + '/api/rbac/v1/access/?application=*', [], resolve, reject)
    })
}

module.exports = () => {
    if(window.localStorage){
        if(!window.localStorage.getItem('rbac-response') || (Date.now() > JSON.parse(window.localStorage.getItem('rbac-response')).expires)) {
            permissionsInfo().then((info) => {
                // caching for 10 minutes
                expTime = Date.now() + 10 * 60 * 1000;
                data = { expires: expTime, permissions: info }
                window.localStorage.setItem('rbac-response', JSON.stringify(data));
                return data
                // FIX: doesn't work the first time
            })
            .catch(error => {
                console.log(error)
            });
        }
        else{
            return JSON.parse(window.localStorage.getItem('rbac-response'))
        }
    }

};
