import { applyReducerHash } from '@red-hat-insights/insights-frontend-components/Utilities/ReducerRegistry';

import {
    clickReducer, globalNavReducer, appNavClick, navToggleReducer, loginReducer, clearActive
} from './reducers';
import {
    CLICK_ACTION, GLOBAL_NAV_IDENT, APP_NAV_CLICK, NAVIGATION_TOGGLE, USER_LOGIN, CLEAR_ACTIVE
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
