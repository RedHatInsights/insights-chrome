import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'babel-polyfill';

configure({ adapter: new Adapter() });
global.SVGPathElement = function () {};

global.MutationObserver = class {
    constructor(callback) {}
    disconnect() {}
    observe(element, initObject) {}
};

global.fetch = require('jest-fetch-mock');
global.window = Object.create(window);

/**
 * To get around Error: Not implemented: navigation (except hash changes)
 * Also enables spy and mock implementation on replace. Add missing attributes here.
 */
delete window.location;
window.location = { replace: jest.fn(), pathname: 'https://localhost' };

/**
 * Mock local storage
 */
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: function(key) {
            return store[key];
        },
        setItem: function(key, value) {
            store[key] = value.toString();
        },
        clear: function() {
            store = {};
        },
        removeItem: function(key) {
            delete store[key];
        }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

global.window.insights = {
    ...window.insights || {},
    chrome: {
        ...(window.insights && window.insights.chrome) || {},
        isBeta: () => {
            return null;
        },
        isProd: false,
        auth: {
            ...(window.insights && window.insights.chrome && window.insights.chrome) || {},
            getUser: () => new Promise((res) => res({
                identity: {
                    // eslint-disable-next-line camelcase
                    account_number: '0',
                    type: 'User'
                },
                entitlements: {
                    insights: {
                        // eslint-disable-next-line camelcase
                        is_entitled: true
                    }
                }
            }))
        },
        getUserPermissions: () => Promise.resolve([])
    }
};
