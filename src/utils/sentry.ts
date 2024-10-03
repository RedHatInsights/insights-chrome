import * as Sentry from '@sentry/react';
import * as SentryBrowser from '@sentry/browser';
import { ChromeUser } from '@redhat-cloud-services/types';
import { isProd } from './common';

let sentryInitialized = false;

function getAppDetails() {
  const pathName = window.location.pathname.split('/');
  let appGroup;
  let appName;
  let betaCheck;

  if (pathName[1] === 'beta') {
    betaCheck = ' Beta';
    appGroup = pathName[2];
    appName = appGroup === 'landing' ? 'landing' : pathName[3];
  } else {
    betaCheck = '';
    appGroup = pathName[1];
    appName = appGroup === 'landing' ? 'landing' : pathName[2];
  }

  const appDetails = {
    beta: betaCheck,
    app: {
      group: appGroup,
      name: appName,
    },
  };

  return appDetails;
}
const EXTRA_KEY = 'ROUTE_TO';

const transport = SentryBrowser.makeMultiplexedTransport(SentryBrowser.makeFetchTransport, (args) => {
  const event = args.getEvent();
  if (event && event.extra && EXTRA_KEY in event.extra && Array.isArray(event.extra[EXTRA_KEY])) {
    return event.extra[EXTRA_KEY];
  }
  return [];
});

function initSentry() {
  if (sentryInitialized) {
    return;
  }

  sentryInitialized = true;
  const appDetails = getAppDetails();
  //These two apps will not be set up as of now. This helps limit transacations
  const avoidedApps = ['subscriptions', 'image-builder'];

  // dsn: key
  // environment: logs Prod or Prod Beta for filtering
  // maxBreadcrumbs, if there is an error, trace back up to (x) lines if needed
  // attachStacktrace: attach the actual console logs
  // sampleRate: 0.0 to 1.0 - percentage of events to send (1.0 by default)
  // replaysOnErrorSampleRate: the sample rate for replays that are recorded when an error happens. Up to 1 minute before error, and until session stops.
  // ^ 1.0 captures all sessions with an error, and 0 captures none.
  // maskAllInputs: mask values of inpute elements before sending to server
  // maskeAllText: mask all text on the screen.
  // ignoreErrors: Sentry ignores errors containing strings or regex. Regex needs to be exact message, string is partial
  // replaysSessionSampleRate: replays that begin recording immediately and last the entirety of the user's session.
  // transport is what allows consumed apps to tell chrome what dsn to send things too.
  Sentry.init({
    //default api_key -> cp-001-insights
    dsn: 'https://8b6372cad9604745ae3606bc4adc0060@o271843.ingest.sentry.io/1484024',
    environment: `Prod${appDetails.beta}`,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, maskAllInputs: true }),
      Sentry.moduleMetadataIntegration(),
    ],
    tracesSampleRate: 0.1,
    debug: !!window.localStorage.getItem('chrome:sentry:debug'),
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.3,
    transport,
    beforeSend: (event) => {
      if (event?.exception?.values?.[0]?.stacktrace?.frames) {
        const frames = event.exception.values[0].stacktrace.frames;
        // Find the last frame with module metadata containing a DSN
        const routeTo = frames
          .filter((frame) => frame.module_metadata && frame.module_metadata.dsn)
          .map((v) => v.module_metadata)
          .slice(-1); // using top frame only

        if (routeTo.length) {
          event.extra = {
            ...event.extra,
            [EXTRA_KEY]: routeTo,
          };
        }
      }

      return event;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeSendTransaction: (event: any) => {
      const appName = event?.contexts?.app?.app_name;
      if (avoidedApps.includes(appName)) {
        return null;
      }
      return event;
    },
  });
}

// Sets up the tagging in sentry. This is stuff that can be filtered.
// Any window variable needs to be declared *above* the configureScope
/* eslint-disable camelcase */
function sentryTags(user: ChromeUser) {
  const appDetails = getAppDetails();
  const browser_width = window.innerWidth + ' px';

  // TODO: Add request_id to this when we have it
  const scope = SentryBrowser.getCurrentScope();
  scope.setUser({
    id: user.identity.account_number,
    account_id: user.identity.internal?.account_id,
  });
  scope.setTags({
    app_name: appDetails.app.name,
    app_group: appDetails.app.group,
    location: 'frontend',
    browser_width: browser_width,
  });
}

/* eslint-enable camelcase */
export default (user: ChromeUser) => {
  // this should only be enabled for prod and prod beta
  if (isProd()) {
    initSentry();
    sentryTags(user);
  } else {
    console.log('Not initalizing sentry, on a pre-prod environment');
  }
};
