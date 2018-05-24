import { applyReducerHash } from '@red-hat-insights/insights-frontend-components';

import { clickReducer } from './reducers';
import { CLICK_ACTION } from './action-types';

const reducers = {
    [CLICK_ACTION]: clickReducer
};

export default function() {
    // const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

    return {
        chrome: (state = {}, action) => applyReducerHash(reducers)(state, action)
    }
}