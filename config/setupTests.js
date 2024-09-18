import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch';

global.SVGPathElement = function () {};

class ObserverShim {
  observe() {
    void 0;
  }

  disconnect() {
    void 0;
  }
}

global.ErrorEvent ??= Event;
global.IntersectionObserver ??= ObserverShim;
global.MutationObserver ??= ObserverShim;
global.matchMedia = () => new EventTarget();
global.getComputedStyle ??= function () {
  return {
    getPropertyPriority() {
      return '';
    },
    getPropertyValue() {
      return '';
    },
  };
};

global.window = Object.create(window);

Object.defineProperty(global.window.document, 'cookie', {
  writable: true,
  value: '',
});

global.window.insights = {
  ...(window.insights || {}),
  chrome: {
    ...((window.insights && window.insights.chrome) || {}),
    isBeta: () => {
      return null;
    },
    getEnvironment: () => 'test',
    isPenTest: () => false,
    isProd: false,
    auth: {
      ...((window.insights && window.insights.chrome && window.insights.chrome) || {}),
      getUser: () =>
        new Promise((res) =>
          res({
            identity: {
              // eslint-disable-next-line camelcase
              account_number: '0',
              type: 'User',
              org_id: '123',
            },
            entitlements: {
              insights: {
                // eslint-disable-next-line camelcase
                is_entitled: true,
              },
            },
          })
        ),
      getToken: () => Promise.resolve('a.a'),
    },
    getUserPermissions: () => Promise.resolve([]),
    getBundle: () => '',
  },
};

// Required for React 18 but not provided by jsdom env. See: https://github.com/jsdom/jsdom/issues/2524
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
