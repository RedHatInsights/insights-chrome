import auth from './auth';
import analytics from './analytics';
import sentry from './sentry';
import { rootApp, noAccess }   from './chrome/entry';
import { navLoader } from './App/Sidenav';
import createChromeIntance from './chrome/create-chrome';

//Add redhat font to body
document.querySelector('body').classList.add('pf-m-redhat-font');

// start auth asap
const libjwt = auth();

function noop () {}

// render root app
rootApp();

// render navigation
navLoader();

libjwt.initPromise.then(() => {
    libjwt.jwt.getUserInfo().then((...data) => {
        analytics(...data);
        sentry(...data);
        noAccess();
    }).catch(noop);
});

window.insights = window.insights || {};

window.insights = createChromeIntance(libjwt, window.insights);
