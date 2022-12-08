import * as actionTemplates from './actions';
import chromeReducer, { chromeInitialState } from '.';
import ReducerRegistry, { dispatchActionsToStore } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import MiddlewareListener from '@redhat-cloud-services/frontend-components-utilities/MiddlewareListener';
import logger from 'redux-logger';
import promise from 'redux-promise-middleware';
import { ReduxState } from './store';

const basicMiddlewares = [];
if (process.env.NODE_ENV === 'development' || (window && window.localStorage.getItem('chrome:redux:debug') === 'true')) {
  basicMiddlewares.push(logger);
}

export const middlewareListener = new MiddlewareListener();
const reduxRegistry = new ReducerRegistry<ReduxState>(chromeInitialState, [promise, middlewareListener.getMiddleware(), ...basicMiddlewares]);

reduxRegistry.register(chromeReducer());
const store = reduxRegistry.getStore();

const actions = dispatchActionsToStore<typeof actionTemplates>(actionTemplates, store);

export function spinUpStore() {
  return { store, middlewareListener, actions };
}
