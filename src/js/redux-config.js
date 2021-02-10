import * as actionTemplates from './redux/actions';
import chromeReducer from './redux';
import ReducerRegistry, { dispatchActionsToStore } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import MiddlewareListener from '@redhat-cloud-services/frontend-components-utilities/MiddlewareListener';
import logger from 'redux-logger';
import promise from 'redux-promise-middleware';

const basicMiddlewares = [];
if (process.env.NODE_ENV === 'development' || (window && window.localStorage.getItem('chrome:redux:debug') === 'true')) {
  basicMiddlewares.push(logger);
}

const middlewareListener = new MiddlewareListener();
const reduxRegistry = new ReducerRegistry({ chrome: {} }, [promise, middlewareListener.getMiddleware(), ...basicMiddlewares]);

reduxRegistry.register(chromeReducer());
const store = reduxRegistry.getStore();

const actions = dispatchActionsToStore(actionTemplates, store);

export function spinUpStore() {
  return { store, middlewareListener, actions };
}
