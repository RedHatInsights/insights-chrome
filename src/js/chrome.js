import auth from './auth';
import analytics from './analytics';
import sentry from './sentry';
import { rootApp, noAccess } from './chrome/entry';
import { navLoader } from './App/Sidenav';
import createChromeInstance from './chrome/create-chrome';
import registerUrlObserver from './url-observer';

//Add redhat font to body
document.querySelector('body').classList.add('pf-m-redhat-font');

// start auth asap
const libjwt = auth();

function noop() {}

// render root app
rootApp();

// render navigation
navLoader();

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
