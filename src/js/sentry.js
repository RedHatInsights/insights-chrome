import * as Sentry from '@sentry/browser';

const API_KEY = 'https://80e5a70255df4bd3ba6eb3b4bfebc58c@sentry.io/1466891';

// - Sentry Options
// dsn: key
// environment: logs PROD or PROD Beta for filtering
// maxBreadcrumbs, if there is an error, trace back up to (x) lines if needed
// attachStacktrace: attach the actual console logs
// debug: will attempt to print out useful debugging information if something goes wrong with sending the event
// sampleRate: 0.0 to 1.0 - percentage of events to send (1.0 by default)

function initSentry() {
    let betaCheck = (window.location.pathname.split('/')[1] === 'beta' ? ' Beta' : '');

    Sentry.init({
        dsn: API_KEY,
        environment: `PROD${betaCheck}`,
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        debug: true
    });
}

/* eslint-disable camelcase */
function sentryUser(user) {
    // TODO: Add request_id to this
    Sentry.configureScope((scope) => {
        scope.setUser({
            id: user.identity.account_number,
            account_id: user.identity.internal.account_id
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
