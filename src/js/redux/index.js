import { applyReducerHash } from '@red-hat-insights/insights-frontend-components/Utilities/ReducerRegistry';

import {
    clickReducer, globalNavReducer, appNavClick
} from './reducers';
import {
    CLICK_ACTION, GLOBAL_NAV_IDENT, APP_NAV_CLICK
} from './action-types';

const reducers = {
    [CLICK_ACTION]: clickReducer,
    [GLOBAL_NAV_IDENT]: globalNavReducer,
    [APP_NAV_CLICK]: appNavClick
};

export default function() {
    // const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

    return { chrome: (state = {}, action) => applyReducerHash(reducers)(state, action) };
}
