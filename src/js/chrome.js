import {
    applyReducerHash,
    middlewares,
    dispatchActionsToStore,
    rootReducer,
    addReducer,
    spinUpStore,
    combineReducersWithState,
    clearReducers
} from './redux-config'

window.insights = window.insights || {};
window.insights.redux = {
    middlewares,
    applyReducerHash,
    dispatchActionsToStore,
    rootReducer,
    addReducer,
    spinUpStore,
    combineReducersWithState,
    clearReducers
};