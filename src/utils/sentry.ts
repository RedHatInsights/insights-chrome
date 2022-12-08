import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { ChromeUser } from '@redhat-cloud-services/types';
import { isProd } from './common';

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
function initSentry() {
  const appDetails = getAppDetails();

  let API_KEY;
  switch (appDetails.app.group) {
    case 'insights':
      API_KEY = 'https://8b6372cad9604745ae3606bc4adc0060@o271843.ingest.sentry.io/1484024';
      break;
    case 'landing':
      API_KEY = 'https://d12a17c4a80b43888b30c306d7eb38b4@o271843.ingest.sentry.io/1484026';
      break;
    case 'ansible':
      API_KEY = 'https://03f062e075954433a296e71f243239fd@o271843.ingest.sentry.io/1769648';
      break;
    case 'settings':
      API_KEY = 'https://1002f82b7a444d48bc4c98d0b52f2155@o271843.ingest.sentry.io/5216681';
      break;
    case 'cost-management':
      API_KEY = 'https://61d5da651248485fb89216773932666b@o271843.ingest.sentry.io/5216676';
      break;
    case 'migrations':
      API_KEY = 'https://9dd048c85e524290b67ad98ff96c53ae@o271843.ingest.sentry.io/5216677';
      break;
    case 'subscriptions':
      API_KEY = 'https://4bbe4ac7e9fa4507803de69f9453ce5d@o271843.ingest.sentry.io/5216678';
      break;
    case 'user-preferences':
      API_KEY = 'https://eb32b0236ce045c9b0b9dcc7351c36bb@o271843.ingest.sentry.io/5216687';
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
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.007,
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
export default (user: ChromeUser) => {
  // this should only be enabled for prod and prod beta
  if (isProd()) {
    initSentry();
    sentryTags(user);
  } else {
    console.log('Not initalizing sentry, on a pre-prod environment');
  }
};
