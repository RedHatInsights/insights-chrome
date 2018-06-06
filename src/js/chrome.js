import { spinUpStore } from './redux-config';
import * as actionTypes from './redux/action-types';

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

        window.insights.chrome.$internal = { store };
    }
};
