'use strict';

const API_KEY = 'bde62396-720d-45b5-546a-e02df377a965';

function initPendo(pendoConf) {
    window.pendo.initialize(pendoConf);
}

function isInternalFlag(email, isInternal) {

    if (email.includes('redhat') || isInternal) {
        return '_redhat';
    }

    if (email.includes('ibm')) {
        return '_ibm';
    }

    return '';
}

function getPendoConf(data) {

    const accountID = `${data.identity.internal.account_id}${isInternalFlag(data.identity.user.email, data.identity.user.is_internal)}`;

    const entitlements = {};

    data.entitlements && Object.entries(data.entitlements).forEach(([key, value])=> {
        entitlements[`entitlements-${key}`] = value.is_trial ? 'trial' : value.is_entitled;
    });

    return {
        visitor: {
            id: accountID,
            internal: data.identity.user.is_internal,
            lang: data.identity.user.locale,
            isOrgAdmin: data.identity.user.is_org_admin,
            url: window.location.href,
            urlPathname: window.location.pathname,
            ...entitlements
        },
        account: {
            // TODO add in customer name as name:
            // here if/when we get that in the JWT
            id: data.identity.account_number
        }
    };
}

export default (data) => {

    // eslint-disable-next-line
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];v=['initialize','identify','updateOptions','pageLoad'];for(w=0,x=v.length;w<x;++w)(function(m){o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);y=e.createElement(n);y.async=!0;y.src=`https://cdn.pendo.io/agent/static/${API_KEY}/pendo.js`;z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');

    initPendo(getPendoConf(data));
};
