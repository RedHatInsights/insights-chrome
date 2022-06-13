global.SVGPathElement = function () {};

global.MutationObserver = class {
  constructor(callback) {}
  disconnect() {}
  observe(element, initObject) {}
};

global.fetch = require('jest-fetch-mock');
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
