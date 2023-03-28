/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable camelcase */
const { visibilityFunctions, isVisible } = require('./consts');

describe('visibilityFunctions', () => {
  const originalUser = insights.chrome.auth.getUser;
  const originalProd = insights.chrome.isProd;
  const originalBeta = insights.chrome.isBeta;

  test('isOrgAdmin', async () => {
    global.window.insights.chrome.auth.getUser = () =>
      Promise.resolve({
        identity: {
          user: {
            is_org_admin: true,
          },
        },
      });

    expect(await visibilityFunctions.isOrgAdmin()).toBe(true);
  });

  test('isOrgAdmin - missing', async () => {
    global.window.insights.chrome.auth.getUser = () =>
      Promise.resolve({
        identity: {},
      });

    expect(await visibilityFunctions.isOrgAdmin()).toBe(false);
  });

  test('isActive', async () => {
    global.window.insights.chrome.auth.getUser = () =>
      Promise.resolve({
        identity: {
          user: {
            is_active: true,
          },
        },
      });

    expect(await visibilityFunctions.isActive()).toBe(true);
  });

  test('isActive - missing', async () => {
    global.window.insights.chrome.auth.getUser = () =>
      Promise.resolve({
        identity: {},
      });

    expect(await visibilityFunctions.isActive()).toBe(false);
  });

  test('isInternal', async () => {
    global.window.insights.chrome.auth.getUser = () =>
      Promise.resolve({
        identity: {
          user: {
            is_internal: true,
          },
        },
      });

    expect(await visibilityFunctions.isInternal()).toBe(true);
  });

  test('isInternal - missing', async () => {
    global.window.insights.chrome.auth.getUser = () =>
      Promise.resolve({
        identity: {},
      });

    expect(await visibilityFunctions.isInternal()).toBe(false);
  });

  test('isProd', async () => {
    const { location } = window;
    delete window.location;
    window.location = {
      pathname: '/insights/foo',
      host: 'console.redhat.com',
    };

    expect(visibilityFunctions.isProd()).toBe(true);
    window.location = location;
  });

  test('isProd - false', async () => {
    expect(visibilityFunctions.isProd()).toBe(false);
  });

  test('isBeta', async () => {
    const { location } = window;
    delete window.location;
    window.location = {
      pathname: '/beta/insights/foo',
    };

    expect(visibilityFunctions.isBeta()).toBe(true);
    window.location = location;
  });

  test('isProd - false', async () => {
    global.window.insights.chrome.isBeta = () => false;

    expect(visibilityFunctions.isBeta()).toBe(false);
  });

  describe('entitlements', () => {
    beforeAll(() => {
      global.window.insights.chrome.auth.getUser = () =>
        Promise.resolve({
          entitlements: {
            some: {
              is_entitled: true,
            },
            another: {
              is_entitled: false,
            },
          },
        });
    });

    test('isEntitled - with app', async () => {
      expect(await visibilityFunctions.isEntitled('some')).toBe(true);
      expect(await visibilityFunctions.isEntitled('another')).toBe(false);
      expect(await visibilityFunctions.isEntitled('missing')).toBe(false);
    });

    test('isEntitled - no app', async () => {
      expect((await visibilityFunctions.isEntitled()).some).toBe(true);
      expect((await visibilityFunctions.isEntitled()).another).toBe(false);
    });
  });

  afterAll(() => {
    global.window.insights.chrome.auth.getUser = originalUser;
    global.window.insights.chrome.isBeta = originalBeta;
    global.window.insights.chrome.isProd = originalProd;
  });
});

describe('isVisible', () => {
  test('no apps', () => {
    expect(isVisible(undefined, 'something', true)).toBe(true);
  });

  test('app not included', () => {
    expect(isVisible([], 'something', true)).toBe(true);
  });

  test('visibility object', () => {
    expect(isVisible(['something'], 'something', { something: false })).toBe(false);
    expect(isVisible(['something'], 'something', { something: true })).toBe(true);
  });

  [true, false].map((visibility) => {
    test(`visibility - ${visibility}`, () => {
      expect(isVisible(['something'], 'something', visibility)).toBe(visibility);
    });
  });

  describe('loose permissions', () => {
    const getUserSpy = jest.spyOn(global.window.insights.chrome.auth, 'getUser');
    const getUserPermissions = jest.spyOn(window.insights.chrome, 'getUserPermissions');
    getUserSpy.mockImplementation(() => Promise.resolve());

    beforeEach(() => {
      getUserSpy.mockClear();
      getUserPermissions.mockReset();
    });

    afterAll(() => {
      getUserSpy.mockRestore();
      getUserPermissions.mockRestore();
    });

    test('should return false if user has no required permission', async () => {
      getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'dogs:are:best' }]));
      const result = await visibilityFunctions.loosePermissions(['foo:bar:baz', 'beep:boop:beep']);
      expect(result).toEqual(false);
    });

    test('should return true if user has atleast one required permission', async () => {
      getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'foo:bar:baz' }, { permission: 'dogs:are:best' }]));
      const result = await visibilityFunctions.loosePermissions(['foo:bar:baz', 'beep:boop:beep']);
      expect(result).toEqual(true);
    });
  });
});
