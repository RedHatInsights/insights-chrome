'use strict';

function initPendo(pendoConf) {
    window.pendo.initialize(pendoConf);
}

export default (user) => {

    // eslint-disable-next-line
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=[];v=['initialize','identify','updateOptions','pageLoad'];for(w=0,x=v.length;w<x;++w)(function(m){o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/f210c485-387f-43ad-4eee-f55bab22507f/pendo.js';z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');

    const pendoConf = {
        apiKey: 'f210c485-387f-43ad-4eee-f55bab22507f',
        visitor: {
            id: user.id,
            internal: user.internal,
            lang: user.lang
        },
        account: {
            id: user.account_id,
            accountNumber: user.account_number
        }
    };

    initPendo(pendoConf);
};
