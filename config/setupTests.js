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
