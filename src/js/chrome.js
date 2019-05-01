import auth from './auth';
import analytics from './analytics';
import { bootstrap, chromeInit }   from './entry';

// start auth asap
const libjwt = auth();

function noop () {}

libjwt.initPromise.then(() => {
    libjwt.jwt.getUserInfo().then(analytics).catch(noop);
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
