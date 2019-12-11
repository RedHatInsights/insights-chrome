import auth from './auth';
import analytics from './analytics';
import sentry from './sentry';
import { bootstrap, chromeInit, rootApp, noAccess }   from './entry';

// start auth asap
const libjwt = auth();

function noop () {}

rootApp();

libjwt.initPromise.then(() => {
    libjwt.jwt.getUserInfo().then((...data) => {
        analytics(...data);
        sentry(...data);
    }).catch(noop);
});

window.insights = window.insights || {};

const init = () => {
    window.insights.chrome = {
        ...window.insights.chrome,
        ...chromeInit(libjwt)
    };
};

window.insights = {
    ...window.insights,
    ...bootstrap(libjwt, init)
};

noAccess();
