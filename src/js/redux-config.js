import * as actionTemplates from './redux/actions';
import chromeReducer from './redux';
import ReducerRegistry, { dispatchActionsToStore }
    from '@red-hat-insights/insights-frontend-components/Utilities/ReducerRegistry';
import MiddlewareListener from '@red-hat-insights/insights-frontend-components/Utilities/MiddlewareListener';

import options, { grouppedNav } from './nav/globalNav.js';

const basicMiddlewares = [];
if (process.env.NODE_ENV === 'development') {
    import('redux-logger').then(logger => basicMiddlewares.push(logger.default));
}

// const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export function spinUpStore(middlewares = []) {
    const middlewareListener = new MiddlewareListener();
    const reduxRegistry = new ReducerRegistry(
        initialState(),
        [
            middlewareListener.getMiddleware(),
            ...basicMiddlewares,
            ...middlewares
        ]
    );

    reduxRegistry.register(chromeReducer());
    const store = reduxRegistry.getStore();

    const actions = dispatchActionsToStore(actionTemplates, store);
    return { store, middlewareListener, actions };
}

function initialState () {
    const splitted = location.pathname.split('/') ;
    const active = splitted[1] === 'demo' ? splitted[2] : splitted[1];
    return {
        chrome: {
            ...grouppedNav[active] ? {
                globalNav: grouppedNav[active].routes,
                activeTechnology: grouppedNav[active].title,
                activeLocation: active
            } : {
                globalNav: options,
                activeTechnology: 'Applications'
            }
        }
    };
}
