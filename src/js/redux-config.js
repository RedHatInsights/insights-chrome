import { combineReducers, compose, createStore, applyMiddleware } from 'redux';
import * as actions from './redux/actions';
import chromeReducer from './redux';

export function applyReducerHash(reducerHash, state, action) {
    let newState = state;

    if (Object.prototype.hasOwnProperty.call(reducerHash, action.type)) {
        newState = reducerHash[action.type](state, action);
    }

    return newState;
}

export const middlewares = [];

if (process.env.NODE_ENV === 'development') {
    const logger = require('redux-logger').default;
    middlewares.push(logger);
}


const reducers = new Set();


export function rootReducer(state, action) {
    let newState = state;

    reducers.forEach(appReducer => {
        newState = appReducer(newState, action);
    });

    return newState;
}


export function addReducer(appReducer) {
    reducers.add(appReducer);

    return () => {
        reducers.delete(appReducer);
    };
}


export function clearReducers() {
    reducers.clear();
}

export function combineReducersWithState(reducersObject) {
    return (state, action) => {
        const combinedState = Object.keys(reducersObject).reduce((acc, curr) => ({
            ...acc,
            [curr]: state[curr],
        }), {});
        return {
            ...state,
            ...combineReducers(reducersObject)(combinedState, action)
        };
    };
}

export function dispatchActionsToStore(actions, store) {
    return Object.keys(actions).reduce((acc, curr) => ({
        ...acc,
        [curr]: (...passTrough) => store && store.dispatch(actions[curr](...passTrough)),
    }), {})
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export function spinUpStore(initState = {}) {
    addReducer(chromeReducer());
    const store = createStore(
        rootReducer,
        initState,
        composeEnhancers(applyMiddleware(...middlewares))
    );
    insights.redux.actions = dispatchActionsToStore(actions, store);
    insights.redux.store = store;
    return store;
}
