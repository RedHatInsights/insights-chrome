import * as Sentry from '@sentry/react';
import * as SentryBrowser from '@sentry/browser';
import { ChromeUser } from '@redhat-cloud-services/types';
import { isProd } from './common';

let sentryInitialized = false;

//TODO: Manually add an appName for when url is just console.redhat.com
export function getAppDetails() {
  const pathName = window.location.pathname.split('/');
  let appGroup = 'insights';
  let appName;
  appGroup = pathName[1];
  if (appGroup === 'openshift') {
    appName = pathName[3];
  } else {
    appName = pathName[2];
  }

  const appDetails = {
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
  type ConfiguredApp = {
    appName: string;
    dsn: string;
    project: string;
  };

  type ConfiguredApps = {
    [key: string]: ConfiguredApp[];
  };
  sentryInitialized = true;
  const appDetails = getAppDetails();
  const configuredApps: ConfiguredApps = {
    insights: [
      {
        appName: 'inventory',
        dsn: 'https://f6f21a635c05b0f91875de6a557f8c34@o490301.ingest.us.sentry.io/4507454722211840',
        project: 'inventory-rhel',
      },
      {
        appName: 'patch',
        dsn: 'https://7308344e3a96d7a5c31a2d3899328f10@o490301.ingest.us.sentry.io/4508683262951424',
        project: 'patchman-rhel',
      },
      {
        appName: 'advisor',
        dsn: 'https://f8eb44de949e487e853185c09340f3cf@o490301.ingest.us.sentry.io/4505397435367424',
        project: 'advisor-rhel',
      },
      {
        appName: 'dashboard',
        dsn: 'https://cf3d9690738f2e4beb92e5c32b92aeb4@o490301.ingest.us.sentry.io/4508683243028485',
        project: 'dashboard-rhel',
      },
      {
        appName: 'vulnerability',
        dsn: 'https://cb035c73625db2cf00141494a95bdedb@o490301.ingest.us.sentry.io/4508683271077888',
        project: 'vulnerability-rhel',
      },
      {
        appName: 'compliance',
        dsn: 'https://6410c806f0ac7b638105bb4e15eb3399@o490301.ingest.us.sentry.io/4508083145408512',
        project: 'compliance-rhel',
      },
      {
        appName: 'malware',
        dsn: 'https://1422e636c948549d1dea1c8e87387aa3@o490301.ingest.us.sentry.io/4508683260002304',
        project: 'malware-rhel',
      },
      {
        appName: 'remediations',
        dsn: 'https://5d7d7a7fb9032c5316f131dc8323137c@o490301.ingest.us.sentry.io/4508683233787904',
        project: 'remediations-rhel',
      },
      {
        appName: 'tasks',
        dsn: 'https://5b8c5a580090ff977052ac622b242057@o490301.ingest.us.sentry.io/4508683269570560',
        project: 'tasks-rhel',
      },
      {
        appName: 'registration',
        dsn: 'https://95df6c65ea4016243ee2bcc2d45fcba8@o490301.ingest.us.sentry.io/4508683266686976',
        project: 'registration-assistant-rhel',
      },
      {
        appName: 'connector',
        dsn: 'https://08c275222a74229dda763dec7c7c2fa8@o490301.ingest.us.sentry.io/4508683268128768',
        project: 'sed-frontend-rhc',
      },
      {
        appName: 'image-builder',
        dsn: 'https://f4b4288bbb7cf6c0b2ac1a2b90a076bf@o490301.ingest.us.sentry.io/4508297557901312',
        project: 'image-builder-rhel',
      },
      {
        appName: 'content-sources',
        dsn: 'https://2578944726a33e0e2e3971c976a87e08@o490301.ingest.us.sentry.io/4510123991171072',
        project: 'content-sources',
      },
    ],
    openshift: [
      {
        appName: 'advisor',
        dsn: 'https://27daee0fa0238ac7f7d5389b8ac8f825@o490301.ingest.us.sentry.io/4508683272454144',
        project: 'ocp-advisor',
      },
      {
        appName: 'vulnerability',
        dsn: 'https://e88ee1ea3dcfd65015894853d75edf1c@o490301.ingest.us.sentry.io/4508683273830400',
        project: 'ocp-vulnerability',
      },
    ],
  };

  // dsn: key
  // environment: logs Prod or Prod Beta for filtering (potential future changes for filtering)
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
    environment: `Prod`,
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
        const configuredApp = configuredApps[appDetails.app.group].filter((app) => app.appName === event.tags?.app_name);

        if (routeTo.length) {
          event.extra = {
            ...event.extra,
            [EXTRA_KEY]: routeTo,
          };
        } else if (configuredApp) {
          event.extra = {
            ...event.extra,
            [EXTRA_KEY]: [{ ...configuredApp[0], org: 'red-hat-it', configuredApp: true }],
          };
        }
      }

      return event;
    },
  });
}

// Sets up the tagging in sentry. This is stuff that can be filtered.
// Any window variable needs to be declared *above* the configureScope

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

export default (user: ChromeUser) => {
  // this should only be enabled for prod and prod beta
  if (isProd()) {
    initSentry();
    sentryTags(user);
  } else {
    console.log('Not initalizing sentry, on a pre-prod environment');
  }
};
