import * as Sentry from '@sentry/browser';

function getAppDetails() {

    const pathName = window.location.pathname.split('/');
    let appGroup;
    let appName;
    let betaCheck;

    if (pathName[1] === 'beta') {
        betaCheck = ' Beta';
        appGroup = pathName[2];
        appName = (appGroup === 'landing' ? 'landing' : pathName[3]);
    } else {
        betaCheck = '';
        appGroup = pathName[1];
        appName = (appGroup === 'landing' ? 'landing' : pathName[2]);
    }

    const appDetails = {
        beta: betaCheck,
        app: {
            group: appGroup,
            name: appName
        }
    };

    return appDetails;
}

// Actually initialize sentry with the group's api key
function initSentry() {

    const appDetails = getAppDetails();

    let API_KEY;
    switch (appDetails.app.group) {
        case 'insights':
            API_KEY = 'https://8b6372cad9604745ae3606bc4adc0060@sentry.io/1484024';
            break;
        case 'landing':
            API_KEY = 'https://d12a17c4a80b43888b30c306d7eb38b4@sentry.io/1484026';
            break;
        case 'ansible':
            API_KEY = 'https://03f062e075954433a296e71f243239fd@sentry.io/1769648';
            break;
    }

    // dsn: key
    // environment: logs Prod or Prod Beta for filtering
    // maxBreadcrumbs, if there is an error, trace back up to (x) lines if needed
    // attachStacktrace: attach the actual console logs
    // sampleRate: 0.0 to 1.0 - percentage of events to send (1.0 by default)
    Sentry.init({
        dsn: API_KEY,
        environment: `Prod${appDetails.beta}`,
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        beforeSend(event, hint) {
            const error = hint.originalException;
            if (error && error.message && error.message.match(/Request failed with status code 403/i)) {
                return null;
            }
            return event;
        }
    });
}

// Sets up the tagging in sentry. This is stuff that can be filtered.
// Any window variable needs to be declared *above* the configureScope
/* eslint-disable camelcase */
function sentryTags(user) {

    const appDetails = getAppDetails();
    const browser_width = window.innerWidth + ' px';

    // TODO: Add request_id to this when we have it
    Sentry.configureScope((scope) => {
        scope.setUser({
            id: user.identity.account_number,
            account_id: user.identity.internal.account_id
        });
        scope.setTags({
            app_name: appDetails.app.name,
            app_group: appDetails.app.group,
            location: 'frontend',
            browser_width: browser_width
        });
    });
}

/* eslint-enable camelcase */
export default (user) => {
    let environment = window.location.host.split('.')[0];

    // if env === [cloud].redhat.com, actually init.
    if (environment === 'cloud') {
        initSentry();
        sentryTags(user);
    }
};
