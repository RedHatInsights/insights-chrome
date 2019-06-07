import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/files/ReducerRegistry';

import {
    clickReducer, globalNavReducer, appNavClick, navToggleReducer, loginReducer, clearActive, chromeNavUpdate
} from './reducers';
import {
    CLICK_ACTION, GLOBAL_NAV_IDENT, APP_NAV_CLICK, NAVIGATION_TOGGLE, USER_LOGIN, CLEAR_ACTIVE, CHROME_NAV_UPDATE
} from './action-types';

const reducers = {
    [CLEAR_ACTIVE]: clearActive,
    [CLICK_ACTION]: clickReducer,
    [GLOBAL_NAV_IDENT]: globalNavReducer,
    [APP_NAV_CLICK]: appNavClick,
    [NAVIGATION_TOGGLE]: navToggleReducer,
    [USER_LOGIN]: loginReducer
};

export default function() {
    // const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

    return { chrome: (state = {}, action) => applyReducerHash(reducers)(state, action) };
}
