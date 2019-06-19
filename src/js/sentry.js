import * as Sentry from '@sentry/browser';

// - Sentry Options
// dsn: key
// environment: logs PROD or PROD Beta for filtering
// maxBreadcrumbs, if there is an error, trace back up to (x) lines if needed
// attachStacktrace: attach the actual console logs
// debug: will attempt to print out useful debugging information if something goes wrong with sending the event
// sampleRate: 0.0 to 1.0 - percentage of events to send (1.0 by default)

function getAppDetails() {

    const pathName = window.location.pathname.split('/');
    let appGroup;
    let appName;
    let betaCheck;

    if (pathName[1] === 'beta') {
        betaCheck = ' Beta';
        appGroup = pathName[2];
        appName = pathName[3];
    } else {
        betaCheck = '';
        appGroup = pathName[1];
        appName = pathName[2];
    }

    const appDetails = {
        beta: betaCheck,
        app: {
            group: appGroup || 'landing',
            name: appName || 'landing'
        }
    };

    return appDetails;
}

function initSentry() {

    const appDetails = getAppDetails();

    let API_KEY;
    switch (appDetails.app.group) {
        case 'insights':
            API_KEY = 'https://8b6372cad9604745ae3606bc4adc0060@sentry.io/1484024';
            break;
        case 'rhel':
            API_KEY = 'https://4eef42e265754c63bbd5da89e0d4870a@sentry.io/1484046';
            break;
        case 'openshift':
            API_KEY = 'https://ec932d46ba4b43d8a4bb21289c1e34a3@sentry.io/1484057';
            break;
        case 'landing':
            API_KEY = 'https://d12a17c4a80b43888b30c306d7eb38b4@sentry.io/1484026';
            break;
    }

    Sentry.init({
        dsn: API_KEY,
        environment: `DEV${appDetails.beta}`,
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        debug: true
    });
}

/* eslint-disable camelcase */
function sentryUser(user) {

    const appDetails = getAppDetails();

    // TODO: Add request_id to this
    Sentry.configureScope((scope) => {
        scope.setUser({
            id: user.identity.account_number,
            account_id: user.identity.internal.account_id
        });
        scope.setTags({
            app_name: appDetails.app.name,
            app_group: appDetails.app.group
        });
    });
}
/* eslint-enable camelcase */

export default (user) => {
    let environment = window.location.host.split('.')[0];

    if (environment === 'cloud') {
        initSentry();
        sentryUser(user);
    }
};
