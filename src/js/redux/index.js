import { combineReducersWithState, applyReducerHash } from '../redux-config';

import { clickReducer } from './reducers';
import { CLICK_ACTION } from './action-types';

const reducers = {
    [CLICK_ACTION]: clickReducer
};

export default function() {
    const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

    return combineReducersWithState({
        chrome: (state = chromeInitialState, action) => applyReducerHash(reducers, state, action)
    })
}