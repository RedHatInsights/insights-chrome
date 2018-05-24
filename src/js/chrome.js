import { applyReducerHash, dispatchActionsToStore } from '@red-hat-insights/insights-frontend-components';

import {
    spinUpStore,
    combineReducersWithState,
} from './redux-config'

window.insights = window.insights || {};
window.insights.redux = {
    dispatchActionsToStore,
    spinUpStore
};

function onDrawSecondary(secondaryObject) {
    document.createElement('button').attributes(['onclick', secondaryObject[0]])
}