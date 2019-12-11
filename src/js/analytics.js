'use strict';

const log = require('./jwt/logger')('analytics.js');

const API_KEY = 'bde62396-720d-45b5-546a-e02df377a965';

const internalAccounts = [
    6,
    477931,
    540155,
    631105,
    633200,
    636204,
    720046,
    730731,
    761015,
    853019,
    895158,
    901532,
    901578,
    939054,
    939082,
    940527,
    941133,
    958959,
    971738,
    972614,
    1034029,
    1061991,
    1070555,
    1191423,
    1191884,
    1212729,
    1262852,
    1292438,
    1298305,
    1337999,
    1446047,
    1455657,
    1456379,
    1460290,
    1469411,
    1494526,
    5364511,
    1546454,
    1568253,
    1626050,
    1640157,
    1650204,
    5243891,
    5254297,
    5258694,
    5273074,
    5274410,
    5301467,
    5301816,
    5305464,
    5309654,
    5341931,
    5345665,
    5348764,
    5351378,
    5357088,
    5361051,
    5364511,
    5375112,
    5385776,
    5387712,
    5436601,
    5440919,
    5445856,
    5453171,
    5455085,
    5457785,
    5463389,
    5463401,
    5471870,
    5491806,
    5496022,
    5496024,
    5505446,
    5506478,
    5513381,
    5524039,
    5526886,
    5530698,
    5535221,
    5538252,
    5547202,
    5557007,
    5574082,
    5582336,
    5582531,
    5582724,
    5586766,
    5591454,
    5594202,
    5596826,
    5597433,
    5597794,
    5606428,
    5618348,
    5632300,
    5644938,
    5645132,
    5673127,
    5685364,
    5910538,
    6038690,
    6077072,
    6089719,
    6193296,
    6212377,
    6229994,
    6234340,
    6235908,
    6266656,
    6267425,
    6278023,
    6289400,
    6289401,
    6292437
];

function shouldInitPendo(data) {

    const environment = window.location.host.split('.')[0];

    // Keycloak returns data.account_number as a string
    const accountNumber = Number(data.account_number);

    if (environment !== 'cloud' ||
        accountNumber < 100 ||
        isNaN(accountNumber) ||
        data.user.is_internal === true ||
        internalAccounts.includes(accountNumber)) {
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
    if (shouldInitPendo(data.identity)) {
        // eslint-disable-next-line
        (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];v=['initialize','identify','updateOptions','pageLoad'];for(w=0,x=v.length;w<x;++w)(function(m){o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);y=e.createElement(n);y.async=!0;y.src=`https://cdn.pendo.io/agent/static/${API_KEY}/pendo.js`;z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');

        initPendo(getPendoConf(data.identity));
    }
};
