import auth from './auth';
import analytics from './analytics';
import sentry from './sentry';
import { rootApp, noAccess } from './chrome/entry';
import createChromeInstance from './chrome/create-chrome';
import registerUrlObserver from './url-observer';

// start auth asap
const libjwt = auth();

function noop() {}

// render root app
rootApp();

libjwt.initPromise.then(() => {
  libjwt.jwt
    .getUserInfo()
    .then((...data) => {
      analytics(...data);
      sentry(...data);
      noAccess();
    })
    .catch(noop);
});

window.insights = window.insights || {};

window.insights = createChromeInstance(libjwt, window.insights);

if (typeof _satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
  window._satellite.pageBottom();
  registerUrlObserver(window._satellite.pageBottom);
}
