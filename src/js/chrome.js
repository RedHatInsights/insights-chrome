import { spinUpStore } from './redux-config';
import * as actionTypes from './redux/action-types';
import loadInventory from './inventory';
import auth from './auth';
import analytics from './analytics';
import jwt from 'jwt-redhat';

const onAuth = auth();

onAuth.then(() => {
    const userInfo = jwt.getUserInfo();
    analytics(userInfo);
    window.getUser(userInfo);
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
    init () {
        const { store, middlewareListener, actions } = spinUpStore();

        // public API actions
        const { identifyApp, appNav } = actions;
        window.insights.chrome.identifyApp = identifyApp;
        window.insights.chrome.navigation = appNav;

        window.insights.chrome.on = (type, callback) => {
            if (!PUBLIC_EVENTS.hasOwnProperty(type)) {
                throw new Error(`Unknown event type: ${type}`);
            }

            return middlewareListener.addNew(PUBLIC_EVENTS[type](callback));
        };

        window.insights.chrome.getUser = () => onAuth.then(jwt.getUserInfo);
        window.insights.chrome.$internal = { store };
    }
};
window.insights.loadInventory = loadInventory;

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

window.getUser = function (userInfo) {
    document.querySelector('.user-info').prepend(`${userInfo.firstName} ${userInfo.lastName}`);
    document.querySelector('.account-number__value').append(userInfo.id);
};

window.logout = () => { jwt.logout(); };

window.dropdownToggle = () => {
    let dropdown = document.querySelector('.pf-c-dropdown');

    dropdown.classList.toggle('pf-m-expanded');
    dropdown.querySelector('.pf-c-dropdown__menu').toggleAttribute('hidden');

    if (dropdown.classList.contains('pf-m-expanded')) {
        dropdown.querySelector('.pf-c-dropdown__toggle').setAttribute('aria-expanded', true);
    } else {
        dropdown.querySelector('.pf-c-dropdown__toggle').setAttribute('aria-expanded', false);
    }
};
