import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { ChromeUser } from '@redhat-cloud-services/types';
import { isProd } from './common';
import { ChromeState } from '../redux/store';

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

// Actually initialize sentry with the group's api key
function initSentry(state: ChromeState) {
  if (sentryInitialized) {
    return;
  }

  sentryInitialized = true;
  const appDetails = getAppDetails();
  console.log(appDetails, 'appDetails here');
  let API_KEY;
  switch (state.sentryApp) {
    case 'insights':
      API_KEY = 'https://8b6372cad9604745ae3606bc4adc0060@o271843.ingest.sentry.io/1484024';
      break;
    case 'advisor':
      API_KEY = 'https://f8eb44de949e487e853185c09340f3cf@o490301.ingest.us.sentry.io/4505397435367424';
      break;
  }
  console.log(state.sentryApp, 'state here');
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

  Sentry.init({
    dsn: API_KEY,
    environment: `Prod${appDetails.beta}`,
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    integrations: [new BrowserTracing(), new Sentry.Replay({ maskAllText: false, maskAllInputs: true })],
    tracesSampleRate: 0.2,
    debug: !!window.localStorage.getItem('chrome:sentry:debug'),
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.3,
  });
}

// Sets up the tagging in sentry. This is stuff that can be filtered.
// Any window variable needs to be declared *above* the configureScope
/* eslint-disable camelcase */
function sentryTags(user: ChromeUser) {
  const appDetails = getAppDetails();
  const browser_width = window.innerWidth + ' px';

  // TODO: Add request_id to this when we have it
  Sentry.configureScope((scope) => {
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
  });
}

/* eslint-enable camelcase */
export default (user: ChromeUser, state: ChromeState) => {
  // this should only be enabled for prod and prod beta
  if (isProd()) {
    initSentry(state);
    sentryTags(user);
  } else {
    console.log('Not initalizing sentry, on a pre-prod environment');
    initSentry(state);
    sentryTags(user);
  }
};
