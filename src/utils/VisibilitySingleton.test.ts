/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ChromeUser, VisibilityFunctions } from '@redhat-cloud-services/types';
import { getVisibilityFunctions, initializeVisibilityFunctions } from './VisibilitySingleton';

jest.mock('@scalprum/core', () => {
  return {
    __esModule: true,
    initSharedScope: jest.fn(),
    getSharedScope: jest.fn().mockReturnValue({}),
  };
});

const userMock: ChromeUser = {
  identity: {
    account_number: '0',
    type: 'User',
    org_id: '123',
  },
  entitlements: {
    insights: {
      is_entitled: true,
      is_trial: false,
    },
  },
};

describe('VisibilitySingleton', () => {
  const getUser = jest.fn().mockImplementation(() => Promise.resolve(userMock));
  const getToken = jest.fn().mockImplementation(() => Promise.resolve('a.a'));
  const getUserPermissions = jest.fn();
  let visibilityFunctions: VisibilityFunctions;

  beforeEach(() => {
    initializeVisibilityFunctions({
      getUser,
      getToken,
      getUserPermissions,
      isPreview: false,
    });
    visibilityFunctions = getVisibilityFunctions();
  });

  test('isOrgAdmin', async () => {
    getUser.mockImplementationOnce(() =>
      Promise.resolve({
        ...userMock,
        identity: {
          ...userMock.identity,
          user: {
            ...userMock.identity.user,
            is_org_admin: true,
          },
        },
      })
    );

    expect(await visibilityFunctions.isOrgAdmin()).toBe(true);
  });

  test('isOrgAdmin - missing', async () => {
    getUser.mockImplementationOnce(() =>
      Promise.resolve({
        ...userMock,
        identity: {
          ...userMock.identity,
          user: {
            ...userMock.identity.user,
            is_org_admin: undefined,
          },
        },
      })
    );

    expect(await visibilityFunctions.isOrgAdmin()).toBe(false);
  });

  test('isActive', async () => {
    getUser.mockImplementationOnce(() =>
      Promise.resolve({
        ...userMock,
        identity: {
          ...userMock.identity,
          user: {
            ...userMock.identity.user,
            is_active: true,
          },
        },
      })
    );

    expect(await visibilityFunctions.isActive()).toBe(true);
  });

  test('isActive - missing', async () => {
    getUser.mockImplementationOnce(() =>
      Promise.resolve({
        ...userMock,
        identity: {
          ...userMock.identity,
          user: {
            ...userMock.identity.user,
            is_active: undefined,
          },
        },
      })
    );

    expect(await visibilityFunctions.isActive()).toBe(false);
  });

  test('isInternal', async () => {
    getUser.mockImplementationOnce(() =>
      Promise.resolve({
        ...userMock,
        identity: {
          ...userMock.identity,
          user: {
            ...userMock.identity.user,
            is_internal: true,
          },
        },
      })
    );

    expect(await visibilityFunctions.isInternal()).toBe(true);
  });

  test('isInternal - missing', async () => {
    getUser.mockImplementationOnce(() =>
      Promise.resolve({
        ...userMock,
        identity: {
          ...userMock.identity,
          user: {
            ...userMock.identity.user,
            is_internal: undefined,
          },
        },
      })
    );

    expect(await visibilityFunctions.isInternal()).toBe(false);
  });

  test('isProd', async () => {
    const { location } = window;
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = {
      pathname: '/insights/foo',
      host: 'console.redhat.com',
    };

    expect(visibilityFunctions.isProd()).toBe(true);

    // Properly restore the original location
    Object.defineProperty(window, 'location', {
      value: location,
      writable: true,
    });
  });

  test('isProd - false', async () => {
    expect(visibilityFunctions.isProd()).toBe(false);
  });

  test('isBeta', async () => {
    initializeVisibilityFunctions({
      getUser,
      getToken,
      getUserPermissions,
      isPreview: true,
    });
    visibilityFunctions = getVisibilityFunctions();
    expect(visibilityFunctions.isBeta()).toBe(true);
  });

  test('isProd - false', async () => {
    global.window.insights.chrome.isBeta = () => false;

    expect(visibilityFunctions.isBeta()).toBe(false);
  });

  describe('entitlements', () => {
    beforeAll(() => {
      getUser.mockImplementation(() =>
        Promise.resolve({
          entitlements: {
            some: {
              is_entitled: true,
            },
            another: {
              is_entitled: false,
            },
          },
        })
      );
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

    describe('loose permissions', () => {
      beforeAll(() => {
        getUser.mockImplementation(() => Promise.resolve());
      });

      beforeEach(() => {
        getUser.mockClear();
      });

      afterAll(() => {
        getUser.mockRestore();
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
});
