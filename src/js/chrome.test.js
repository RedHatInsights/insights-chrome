import './test';
import { chromeInit } from './entry';
import * as actions from './redux/actions.js';

const mockedPromis = new Promise(() => {});
const mockedJwt = {
    getUserInfo: () => {
        return { then: () => { return { user: 'mock' }; } };
    }
};

const getMockLibJwt = () => {
    return { initPromise: mockedPromis, jwt: mockedJwt };
};

describe('Chrome API', () => {
    test('can be initialized', () => {
        chromeInit(getMockLibJwt());
    });

    test('allows for an event listener to be registered', () => {
        const chrome = chromeInit(getMockLibJwt());
        chrome.on('APP_NAVIGATION', () => true);
    });

    test('throws an error if an unknown event listener registration is attempted', () => {
        const chrome = chromeInit(getMockLibJwt());
        expect(() => chrome.on('NON_EXISTENT_EVENT', () => true))
        .toThrowError('Unknown event type: NON_EXISTENT_EVENT');
    });

    test('allows for an event listener to be registered', () => {
        let result;
        const chrome = chromeInit(getMockLibJwt());
        chrome.on('APP_NAVIGATION', event => result = event);

        chrome.$internal.store.dispatch(
            actions.appNavClick(
                { id: 'map' },
                { target: document.createElement('button') }
            )
        );
        expect(result.navId).toBe('map');
    });

    test('allows for an event listener to be unregistered', () => {
        let result;
        const chrome = chromeInit(getMockLibJwt());
        const unregister = chrome.on('APP_NAVIGATION', event => result = event);

        chrome.$internal.store.dispatch(
            actions.appNavClick(
                { id: 'map' },
                { target: document.createElement('button') }
            )
        );
        unregister();
        chrome.$internal.store.dispatch(actions.appNavClick({ id: 'widgets' }, { target: document.createElement('i') }));

        expect(result.navId).toBe('map');
    });

});
