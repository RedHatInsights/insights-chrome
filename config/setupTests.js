import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'babel-polyfill';
import { JSDOM } from 'jsdom';

configure({ adapter: new Adapter() });
global.SVGPathElement = function () {};

global.MutationObserver = class {
    constructor(callback) {}
    disconnect() {}
    observe(element, initObject) {}
};

global.fetch = require('jest-fetch-mock');
global.window = Object.create(window);

// const dom = new JSDOM(`<!DOCTYPE html><aside>Hello world</aside>`);
// global.document = dom.window.document;
// global.window = dom.window;

global.window.insights = {
    ...window.insights || {},
    chrome: {
        ...(window.insights && window.insights.chrome) || {},
        isBeta: () => {
            return null;
        },
        auth: {
            ...(window.insights && window.insights.chrome && window.insights.chrome) || {},
            getUser: () => new Promise((res) => res({
                identity: {
                    // eslint-disable-next-line camelcase
                    account_number: '0',
                    type: 'User'
                }
            }))
        }
    }
};
