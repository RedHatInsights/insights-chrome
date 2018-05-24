import { combineReducers, compose, createStore, applyMiddleware } from 'redux';
import * as actions from './redux/actions';
import chromeReducer from './redux';
import {
    ReducerRegistry,
    dispatchActionsToStore,
    MiddlewareListener
} from '@red-hat-insights/insights-frontend-components';

const basicMiddlewares = [];
if (process.env.NODE_ENV === 'development') {
    basicMiddlewares.push(require('redux-logger').default);
}

// const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export function spinUpStore(initState = {}, middlewares = [], composeEnhancers = compose) {
    const middlewareListener = new MiddlewareListener();
    const reduxRegistry = new ReducerRegistry(
        initState,
        [
            middlewareListener.getMiddleware(),
            ...basicMiddlewares,
            ...middlewares
        ]
    );
    const store = reduxRegistry.getStore();
    reduxRegistry.register(chromeReducer());
    insights.redux.actions = dispatchActionsToStore(actions, store);
    insights.redux.chrome = insights.redux.chrome || {};
    insights.redux.chrome.on = (type, callback) => middlewareListener.addNew({ on: type, callback });
    return store;
}
