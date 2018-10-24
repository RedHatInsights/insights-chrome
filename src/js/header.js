import cookies from 'js-cookie';
import parse   from 'url-parse';

// DO THIS FRIST, BEFORE ANYTHING ELSE :D
// Why: this is to ensure (in a sync manner) we have the rh_jwt coookie prepped
// Keycloak sends this back as a query param
// Apps need it to be avalible right away
// the jwt-redhat lib will take care of this
// but it seems to happen only after a network call and we need to to be sync
(function () {
    const url = parse(window.location.href, true);

    if (url.query.hasOwnProperty('code') && url.query.code.length > 4) {
        const fifteenMinutes = new Date(new Date().getTime() + 15 * 60 * 1000);

        // eslint-disable-next-line no-console
        if (console.log) {
            // eslint-disable-next-line no-console
            console.log('chrome_debug: forcing cookie from param');
        }

        cookies.set('rh_jwt', url.query.code, { domain: '.redhat.com', expires: fifteenMinutes });
    }
}());
