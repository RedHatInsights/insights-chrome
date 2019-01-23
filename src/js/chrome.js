import { spinUpStore }  from './redux-config';
import * as actionTypes from './redux/action-types';
import loadInventory    from './inventory';
import loadRemediations from './remediations';
import auth             from './auth';
import analytics        from './analytics';
import loadChrome       from './entry';
import asyncObject      from './async-loader';

// start auth asap
const libjwt = auth();

libjwt.initPromise.then(() => {
    const userInfo = libjwt.jwt.getUserInfo();
    analytics(userInfo);
});

// used for translating event names exposed publicly to internal event names
const PUBLIC_EVENTS = {
    APP_NAVIGATION: fn => ({
        on: actionTypes.APP_NAV_CLICK,
        callback: event => fn({ navId: event.data.id, domEvent: event.data.event })
    })
};

window.insights = window.insights || {};
window.insights.chrome = {
    auth: {
        getUser: () => { return libjwt.initPromise.then(libjwt.jwt.getUserInfo); },
        logout: () => { libjwt.jwt.logout(); }
    },
    isProd: window.location.host === 'access.redhat.com',
    init () {
        const { store, middlewareListener, actions } = spinUpStore();

        libjwt.initPromise.then(() => actions.userLogIn(libjwt.jwt.getUserInfo()));
        // public API actions
        const { identifyApp, appNav, appNavClick } = actions;
        window.insights.chrome.identifyApp = identifyApp;
        window.insights.chrome.navigation = appNav;
        window.insights.chrome.appNavClick = appNavClick;

        window.insights.chrome.on = (type, callback) => {
            if (!PUBLIC_EVENTS.hasOwnProperty(type)) {
                throw new Error(`Unknown event type: ${type}`);
            }

            return middlewareListener.addNew(PUBLIC_EVENTS[type](callback));
        };

        window.insights.chrome.$internal = { store };
        libjwt.initPromise.then(() => {
            loadChrome();
        });
    }
};

window.insights.loadInventory = loadInventory;
window.insights.experimental = {
    loadRemediations
};

window.insights.async = asyncObject;

window.navToggle = () => {
    const mq = window.matchMedia('(min-width: 768px)');
    let page = document.getElementById('ins-c-sidebar');

    if (mq.matches) {
        page.classList.remove('pf-m-expanded');
        page.classList.toggle('pf-m-collapsed');
    } else {
        page.classList.remove('pf-m-collapsed');
        page.classList.toggle('pf-m-expanded');
    }
};
