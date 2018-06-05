import { applyReducerHash } from '@red-hat-insights/insights-frontend-components';

import { clickReducer, appNavReducer, globalNavReducer } from './reducers';
import { CLICK_ACTION, APP_NAV, GLOBAL_NAV_IDENT } from './action-types';

const reducers = {
    [CLICK_ACTION]: clickReducer,
    [APP_NAV]: appNavReducer,
    [GLOBAL_NAV_IDENT]: globalNavReducer
};

export default function() {
    // const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

    return {
        chrome: (state = {}, action) => applyReducerHash(reducers)(state, action)
    }
}
