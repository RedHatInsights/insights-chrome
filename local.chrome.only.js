/*global module*/

// SPANDX_CONFIG=./local.api.only.js bash ~/prog/insights/proxy/scripts/run.sh

module.exports = {
    routes: {
        '/insights/platform' : {host:  'https://access.redhat.com/'}
    }
};