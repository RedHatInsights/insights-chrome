import auth from './auth';
import analytics from './analytics';
import sentry from './sentry';
import createChromeInstance from './chrome/create-chrome';
import registerUrlObserver from './url-observer';
import Cookies from 'js-cookie';

const initialAccount = localStorage.getItem('chrome/active-remote-request');
if (Cookies.get('cross_access_account_number') && initialAccount) {
  try {
    const { end_date } = JSON.parse(initialAccount);
    /**
     * Remove cross account request if it is expired
     */
    if (new Date(end_date).getTime() <= Date.now()) {
      Cookies.remove('cross_access_account_number');
    }
  } catch {
    console.log('Unable to parse initial account. Using default account');
    Cookies.remove('cross_access_account_number');
  }
}

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
