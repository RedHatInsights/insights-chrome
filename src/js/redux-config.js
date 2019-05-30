import * as actionTemplates from './redux/actions';
import chromeReducer from './redux';
import ReducerRegistry, {
    dispatchActionsToStore
} from '@redhat-cloud-services/frontend-components-utilities/files/ReducerRegistry';
import MiddlewareListener from '@redhat-cloud-services/frontend-components-utilities/files/MiddlewareListener';

import groupedNav from './nav/globalNav.json';

const basicMiddlewares = [];
if (process.env.NODE_ENV === 'development') {
    import('redux-logger').then(logger => basicMiddlewares.push(logger.default));
}

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
    const active = splitted[1] === 'beta' ? splitted[2] : splitted[1];

    return {
        chrome: {
            ...groupedNav[active] ? {
                globalNav: groupedNav[active].routes,
                activeTechnology: groupedNav[active].title,
                activeLocation: active
            } : {
                globalNav: groupedNav.insights.routes,
                activeTechnology: 'Applications'
            }
        }
    };
}
