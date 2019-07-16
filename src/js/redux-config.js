import * as actionTemplates from './redux/actions';
import chromeReducer from './redux';
import ReducerRegistry, {
    dispatchActionsToStore
} from '@redhat-cloud-services/frontend-components-utilities/files/ReducerRegistry';
import MiddlewareListener from '@redhat-cloud-services/frontend-components-utilities/files/MiddlewareListener';

const basicMiddlewares = [];
if (process.env.NODE_ENV === 'development') {
    import('redux-logger').then(logger => basicMiddlewares.push(logger.default));
}

export function spinUpStore(middlewares = []) {
    const middlewareListener = new MiddlewareListener();
    const reduxRegistry = new ReducerRegistry(
        { chrome: {} },
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
