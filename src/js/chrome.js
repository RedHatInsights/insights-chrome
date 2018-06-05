import { spinUpStore } from './redux-config'
import * as actionTypes from './redux/action-types';

// used for translating event names exposed publicly to internal event names
const PUBLIC_EVENTS = {
    'APP_NAV_CLICK': actionTypes.APP_NAV_CLICK
};

window.insights = window.insights || {};
window.insights.chrome = {
    init () {
        const { store, middlewareListener, actions } = spinUpStore();

        // public API actions
        const {globalNavIdent, appNav} = actions;
        window.insights.chrome.globalNavIdent = globalNavIdent;
        window.insights.chrome.appNav = appNav;

        window.insights.chrome.on = (type, callback) => {
            if (!PUBLIC_EVENTS.hasOwnProperty(type)) {
                throw new Error(`Unknown event type: ${type}`);
            }

            return middlewareListener.addNew({ on: PUBLIC_EVENTS[type], callback });
        };

        window.insights.chrome.$internal = { store };
    }
};
