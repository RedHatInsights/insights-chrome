import './chrome';
import * as actions from './redux/actions.js';

describe('Chrome API', () => {

    it('can be initialized', () => {
        insights.chrome.init();
    });

    it('allows for an event lister to be registered', () => {
        insights.chrome.init();
        insights.chrome.on('APP_NAV_CLICK', () => true);
    });

    it('throws an error if an unknown event listener registration is attempted', () => {
        insights.chrome.init();
        expect(() => insights.chrome.on('NON_EXISTENT_EVENT', () => true)).toThrowError('Unknown event type: NON_EXISTENT_EVENT');
    });

    it('allows for an event lister to be registered', () => {
        let result;
        insights.chrome.init();
        insights.chrome.on('APP_NAV_CLICK', event => result = event.data.id);

        insights.chrome.$internal.store.dispatch(actions.appNavClick({id: 'map'}, {}));
        expect(result).toBe('map');
    });

    it('allows for an event lister to be unregistered', () => {
        let result;
        insights.chrome.init();
        const unregister = insights.chrome.on('APP_NAV_CLICK', event => result = event.data.id);

        insights.chrome.$internal.store.dispatch(actions.appNavClick({id: 'map'}, {}));
        unregister();
        insights.chrome.$internal.store.dispatch(actions.appNavClick({id: 'widgets'}, {}));

        expect(result).toBe('map');
    });
});
