import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

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

// Mock webpack share scopes for module federation
global.__webpack_share_scopes__ = {
  default: {
    '@chrome/visibilityFunctions': {},
  },
};
global.__webpack_require__ = {
  S: {
    default: {
      '@chrome/visibilityFunctions': {},
    },
  },
};

Object.defineProperty(global.window.document, 'cookie', {
  writable: true,
  value: '',
});

// Crypto object polyfill for JSDOM
global.window.crypto = {
  ...crypto,
};
// in case the crypto package is mangled or the method does not exist
if (!global.window.crypto.randomUUID) {
  global.window.crypto.randomUUID = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Mock localStorage with _origin property for JSDOM
const mockLocalStorage = (() => {
  let store = {};
  return {
    _origin: 'http://localhost',
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
    key: function (index) {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(global.window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
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
