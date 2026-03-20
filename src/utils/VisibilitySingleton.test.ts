import { ChromeUser, VisibilityFunctions } from '@redhat-cloud-services/types';
import { getVisibilityFunctions, initializeVisibilityFunctions } from './VisibilitySingleton';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  afterEach(() => {
    jsdomReset();
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
    jsdomReconfigure({ url: 'https://console.redhat.com/insights/foo' });
    expect(visibilityFunctions.isProd()).toBe(true);
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

      test('should match wildcard permission - full wildcard', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:*:*' }]));
        const result = await visibilityFunctions.loosePermissions(['rbac:inventory:read', 'rbac:cost-management:write']);
        expect(result).toEqual(true);
      });

      test('should match wildcard permission - middle wildcard', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:*:read' }]));
        const result = await visibilityFunctions.loosePermissions(['rbac:inventory:read', 'rbac:cost-management:read']);
        expect(result).toEqual(true);
      });

      test('should match wildcard permission - last wildcard', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:inventory:*' }]));
        const result = await visibilityFunctions.loosePermissions(['rbac:inventory:read', 'rbac:inventory:write']);
        expect(result).toEqual(true);
      });

      test('should not match wildcard when segments differ', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:*:read' }]));
        const result = await visibilityFunctions.loosePermissions(['rbac:inventory:write', 'cost-management:inventory:read']);
        expect(result).toEqual(false);
      });

      test('should not match when segment count differs', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:*:*' }]));
        const result = await visibilityFunctions.loosePermissions(['rbac:inventory', 'rbac:inventory:read:extra']);
        expect(result).toEqual(false);
      });

      test('should match when required permission is wildcard and user has specific', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:inventory:read' }]));
        const result = await visibilityFunctions.loosePermissions(['rbac:*:*', 'other:app:read']);
        expect(result).toEqual(true);
      });
    });

    describe('hasPermissions', () => {
      beforeAll(() => {
        getUser.mockImplementation(() => Promise.resolve());
      });

      beforeEach(() => {
        getUser.mockClear();
      });

      afterAll(() => {
        getUser.mockRestore();
      });

      test('should return false if user does not have all required permissions', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'foo:bar:baz' }]));
        const result = await visibilityFunctions.hasPermissions(['foo:bar:baz', 'beep:boop:beep']);
        expect(result).toEqual(false);
      });

      test('should return true if user has all required permissions', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'foo:bar:baz' }, { permission: 'beep:boop:beep' }]));
        const result = await visibilityFunctions.hasPermissions(['foo:bar:baz', 'beep:boop:beep']);
        expect(result).toEqual(true);
      });

      test('should match all permissions with full wildcard', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:*:*' }]));
        const result = await visibilityFunctions.hasPermissions(['rbac:inventory:read', 'rbac:cost-management:write']);
        expect(result).toEqual(true);
      });

      test('should match specific wildcard patterns', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:inventory:*' }, { permission: 'rbac:cost-management:read' }]));
        const result = await visibilityFunctions.hasPermissions(['rbac:inventory:read', 'rbac:cost-management:read']);
        expect(result).toEqual(true);
      });

      test('should fail when not all wildcards match', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:inventory:*' }]));
        const result = await visibilityFunctions.hasPermissions(['rbac:inventory:read', 'rbac:cost-management:read']);
        expect(result).toEqual(false);
      });

      test('should match when required permission is wildcard and user has specific', async () => {
        getUserPermissions.mockImplementationOnce(() => Promise.resolve([{ permission: 'rbac:inventory:read' }, { permission: 'other:app:write' }]));
        const result = await visibilityFunctions.hasPermissions(['rbac:*:*', 'other:*:write']);
        expect(result).toEqual(true);
      });
    });
  });

  describe('loosePermissionsKessel', () => {
    beforeEach(() => {
      getUser.mockImplementation(() => Promise.resolve(userMock));
      mockedAxios.post.mockReset();
    });

    test('should return false if org_id is missing', async () => {
      getUser.mockImplementationOnce(() =>
        Promise.resolve({
          ...userMock,
          identity: { ...userMock.identity, org_id: undefined },
        })
      );
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_read']);
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('should return false for empty relations array', async () => {
      const result = await visibilityFunctions.loosePermissionsKessel([]);
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('should call checkself for a single relation', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { allowed: 'ALLOWED_TRUE' } });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_read']);
      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/kessel/v1beta2/checkself',
        expect.objectContaining({
          object: { resourceId: 'redhat/123', resourceType: 'tenant', reporter: { type: 'rbac' } },
          relation: 'rbac_roles_read',
        })
      );
    });

    test('should return false for a single denied relation', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { allowed: 'ALLOWED_FALSE' } });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_write']);
      expect(result).toBe(false);
    });

    test('should call checkselfbulk for multiple relations', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { pairs: [{ item: { allowed: 'ALLOWED_FALSE' } }, { item: { allowed: 'ALLOWED_TRUE' } }] },
      });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_write', 'rbac_groups_read']);
      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/kessel/v1beta2/checkselfbulk',
        expect.objectContaining({
          items: [expect.objectContaining({ relation: 'rbac_roles_write' }), expect.objectContaining({ relation: 'rbac_groups_read' })],
        })
      );
    });

    test('should return false when all bulk relations are denied', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { pairs: [{ item: { allowed: 'ALLOWED_FALSE' } }, { item: { allowed: 'ALLOWED_FALSE' } }] },
      });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_write', 'rbac_groups_write']);
      expect(result).toBe(false);
    });

    test('should deduplicate identical relations', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { allowed: 'ALLOWED_TRUE' } });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_read', 'rbac_roles_read']);
      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/kessel/v1beta2/checkself', expect.objectContaining({ relation: 'rbac_roles_read' }));
    });

    test('should return true when at least one relation is allowed (OR logic)', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          pairs: [
            { request: { object: {}, relation: 'rbac_principal_read' }, item: { allowed: 'ALLOWED_FALSE' } },
            { request: { object: {}, relation: 'rbac_groups_read' }, item: { allowed: 'ALLOWED_FALSE' } },
            { request: { object: {}, relation: 'rbac_roles_read' }, item: { allowed: 'ALLOWED_TRUE' } },
            { request: { object: {}, relation: 'rbac_workspace_view' }, item: { allowed: 'ALLOWED_FALSE' } },
          ],
          consistencyToken: { token: 'abc123' },
        },
      });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_principal_read', 'rbac_groups_read', 'rbac_roles_read', 'rbac_workspace_view']);
      expect(result).toBe(true);
    });

    test('should return false on network error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_read']);
      expect(result).toBe(false);
    });
  });
});
