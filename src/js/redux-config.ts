import * as actionTemplates from './redux/actions';
import chromeReducer from './redux';
import ReducerRegistry, { dispatchActionsToStore } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import MiddlewareListener from '@redhat-cloud-services/frontend-components-utilities/MiddlewareListener';
import logger from 'redux-logger';
import promise from 'redux-promise-middleware';
import { ChromeState, GlobalFilterState } from './redux/store';

const basicMiddlewares = [];
if (process.env.NODE_ENV === 'development' || (window && window.localStorage.getItem('chrome:redux:debug') === 'true')) {
  basicMiddlewares.push(logger);
}

const middlewareListener = new MiddlewareListener();
const reduxRegistry = new ReducerRegistry<{ chrome: ChromeState; globalFilter: GlobalFilterState }>(
  {
    chrome: {
      contextSwitcherOpen: false,
      navigation: {},
      accessRequests: {
        hasUnseen: false,
        count: 0,
        data: [],
      },
      quickstarts: {
        quickstarts: {},
      },
    },
    globalFilter: {
      tags: {
        isLoaded: false,
        items: [],
      },
      workloads: {
        isLoaded: false,
      },
      sid: {
        isLoaded: false,
      },
      globalFilterHidden: false,
    },
  },
  [promise, middlewareListener.getMiddleware(), ...basicMiddlewares]
);

reduxRegistry.register(chromeReducer());
const store = reduxRegistry.getStore();

const actions = dispatchActionsToStore<typeof actionTemplates>(actionTemplates, store);

export function spinUpStore() {
  return { store, middlewareListener, actions };
}
