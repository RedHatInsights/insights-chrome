import cookies from 'js-cookie';

// DO THIS FRIST, BEFORE ANYTHING ELSE :D
// Why: this is to ensure (in a sync manner) we have the rh_jwt coookie prepped
// Keycloak sends this back as a query param
// Apps need it to be avalible right away
// the jwt-redhat lib will take care of this
// but it seems to happen only after a network call and we need to to be sync
(function () {
    const search = window.location.search;
    const split = search.split('KEYCLOAK_IDENTITY=');
    const fifteenMinutes = new Date(new Date().getTime() + 15 * 60 * 1000);
    if (split && split.length === 2) {
        // eslint-disable-next-line no-console
        if (console.log) {
            // eslint-disable-next-line no-console
            console.log('chrome_debug: forcing cookie from param');
        }

        cookies.set('rh_jwt', split[1], { domain: '.redhat.com', expires: fifteenMinutes });
    }
}());
