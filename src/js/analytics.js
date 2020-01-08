'use strict';

const API_KEY = 'bde62396-720d-45b5-546a-e02df377a965';

// Checks to see if email contains "redhat" string to blacklist in Pendo
function generateEmail(email, isInternal) {

    if (email.includes('redhat') || isInternal) {
        return `${email}-internal`;
    } else {
        return email;
    }
}

function initPendo(pendoConf) {
    window.pendo.initialize(pendoConf);
}

function getPendoConf(data) {

    const email = generateEmail(data.user.email, data.user.is_internal);

    return {
        visitor: {
            id: data.internal.account_id,
            internal: data.user.is_internal,
            lang: data.user.locale,
            email: email
        },
        account: {
            // TODO add in customer name as name:
            // here if/when we get that in the JWT
            id: data.account_number
        }
    };
}

export default (data) => {

    // eslint-disable-next-line
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];v=['initialize','identify','updateOptions','pageLoad'];for(w=0,x=v.length;w<x;++w)(function(m){o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);y=e.createElement(n);y.async=!0;y.src=`https://cdn.pendo.io/agent/static/${API_KEY}/pendo.js`;z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');

    initPendo(getPendoConf(data.identity));
};
