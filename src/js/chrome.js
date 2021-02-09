import auth from './auth';
import analytics from './analytics';
import sentry from './sentry';
import createChromeInstance from './chrome/create-chrome';
import registerUrlObserver from './url-observer';

// start auth asap
const libjwt = auth();

function noop() {}

//Add redhat font to body
document.querySelector('body').classList.add('pf-m-redhat-font');

libjwt.initPromise.then(() => {
  libjwt.jwt
    .getUserInfo()
    .then((...data) => {
      analytics(...data);
      sentry(...data);
    })
    .catch(noop);
});

window.insights = window.insights || {};

window.insights = createChromeInstance(libjwt, window.insights);

if (typeof _satellite !== 'undefined' && typeof window._satellite.pageBottom === 'function') {
  window._satellite.pageBottom();
  registerUrlObserver(window._satellite.pageBottom);
}

import('./bootstrap');
