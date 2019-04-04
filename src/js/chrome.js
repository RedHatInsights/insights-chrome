import auth             from './auth';
import analytics        from './analytics';
import { bootstrap, chromeInit }   from './entry';

// start auth asap
const libjwt = auth();

libjwt.initPromise.then(() => {
    libjwt.jwt.getUserInfo().then(analytics);
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
