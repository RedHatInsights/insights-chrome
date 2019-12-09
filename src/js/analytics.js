'use strict';

const log = require('./jwt/logger')('analytics.js');

const API_KEY = 'bde62396-720d-45b5-546a-e02df377a965';

const internalAccounts = [
    6089719,
    1460290,
    540155,
    1212729,
    5910538,
    6212377,
    477931,
    6289401,
    6266656,
    6289400,
    901532,
    6235908,
    1455657,
    6278023,
    6193296,
    5685364,
    6234340,
    901578,
    6292437,
    6229994,
    6038690,
    6267425,
    6077072
];

function shouldInitPendo(data) {

    const environment = window.location.host.split('.')[0];

    // Keycloak returns data.account_number as a string
    const account_number = Number(data.account_number);
    
    if (environment !== 'cloud' ||
        account_number < 100 ||
        account_number === NaN ||
        data.user.is_internal === true ||
        internalAccounts.includes(account_number)) {
        log('User is internal or this is pre-production, Pendo will not be initialized');
        return false;
    } else {
        log('Initializing Pendo');
        return true;
    }
}

function initPendo(pendoConf) {
    window.pendo.initialize(pendoConf);
}

function getPendoConf(data) {
    return {
        visitor: {
            id: data.internal.account_id,
            internal: data.user.is_internal,
            lang: data.user.locale
        },
        account: {
            // TODO add in customer name as name:
            // here if/when we get that in the JWT
            id: data.account_number
        }
    };
}

export default (data) => {

    // Check to see if user is internal/has an internal account & isProd
    if(shouldInitPendo(data.identity)) {
        // eslint-disable-next-line
        (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];v=['initialize','identify','updateOptions','pageLoad'];for(w=0,x=v.length;w<x;++w)(function(m){o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);y=e.createElement(n);y.async=!0;y.src=`https://cdn.pendo.io/agent/static/${API_KEY}/pendo.js`;z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');

        initPendo(getPendoConf(data.identity));
    }
};
