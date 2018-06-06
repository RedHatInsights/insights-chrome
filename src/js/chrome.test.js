import './test';
import './chrome';
import * as actions from './redux/actions.js';

describe('Chrome API', () => {

    it('can be initialized', () => {
        insights.chrome.init();
    });

    it('allows for an event lister to be registered', () => {
        insights.chrome.init();
        insights.chrome.on('APP_NAVIGATION', () => true);
    });

    it('throws an error if an unknown event listener registration is attempted', () => {
        insights.chrome.init();
        expect(() => insights.chrome.on('NON_EXISTENT_EVENT', () => true))
            .toThrowError('Unknown event type: NON_EXISTENT_EVENT');
    });

    it('allows for an event lister to be registered', () => {
        let result;
        insights.chrome.init();
        insights.chrome.on('APP_NAVIGATION', event => result = event);

        insights.chrome.$internal.store.dispatch(actions.appNavClick({ id: 'map' }, { target: 'button' }));
        expect(result.navId).toBe('map');
        expect(result.domEvent.target).toBe('button');
    });

    it('allows for an event lister to be unregistered', () => {
        let result;
        insights.chrome.init();
        const unregister = insights.chrome.on('APP_NAVIGATION', event => result = event);

        insights.chrome.$internal.store.dispatch(actions.appNavClick({ id: 'map' }, { target: 'button' }));
        unregister();
        insights.chrome.$internal.store.dispatch(actions.appNavClick({ id: 'widgets' }, { target: 'i' }));

        expect(result.navId).toBe('map');
        expect(result.domEvent.target).toBe('button');
    });
});
