import { ChromeUser, VisibilityFunctions } from '@redhat-cloud-services/types';
import { getVisibilityFunctions, initializeVisibilityFunctions, resetVisibilityFunctions } from './VisibilitySingleton';
import axios from 'axios';
import { ITLess } from './common';
import { VISIBILITY_REQUEST_TIMEOUT_MS } from './visibilityRequestConfig';
import { getFeatureFlagsError, getUnleashClient } from '../components/FeatureFlags/unleashClient';
import { fetchOrgOptIn } from './orgOptInApi';

jest.mock('axios');
jest.mock('./common', () => ({
  ...jest.requireActual('./common'),
  ITLess: jest.fn(() => false),
}));
jest.mock('../components/FeatureFlags/unleashClient', () => ({
  getFeatureFlagsError: jest.fn(() => false),
  getUnleashClient: jest.fn(),
}));
jest.mock('./orgOptInApi', () => ({
  fetchOrgOptIn: jest.fn(),
  resetOrgOptInCache: jest.fn(),
}));
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetFeatureFlagsError = getFeatureFlagsError as jest.Mock;
const mockedGetUnleashClient = getUnleashClient as jest.Mock;
const mockedFetchOrgOptIn = fetchOrgOptIn as jest.Mock;

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
  let visibilityFunctions: VisibilityFunctions & {
    isITLess: (expected: boolean) => boolean;
    isKesselEnabled: (expected: boolean) => boolean;
    isKesselOrgOnboarded: (expected: boolean) => Promise<boolean>;
  };

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

  test('reset removes the shared visibility callbacks', () => {
    resetVisibilityFunctions();

    expect(() => getVisibilityFunctions()).toThrow('Visibility functions were not initialized!');
  });

  describe('hasLocalStorage', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      localStorage.removeItem('visibility-test');
    });

    test('uses getItem and matches the stored string', () => {
      localStorage.setItem('visibility-test', 'enabled');
      const getItem = jest.spyOn(localStorage, 'getItem');

      expect(visibilityFunctions.hasLocalStorage('visibility-test', 'enabled')).toBe(true);
      expect(getItem).toHaveBeenCalledWith('visibility-test');
    });

    test('rejects a missing or different value without coercing types', () => {
      expect(visibilityFunctions.hasLocalStorage('visibility-test', 'true')).toBe(false);
      localStorage.setItem('visibility-test', 'true');
      expect(visibilityFunctions.hasLocalStorage('visibility-test', 'false')).toBe(false);
      expect(visibilityFunctions.hasLocalStorage('visibility-test', true)).toBe(false);
      localStorage.setItem('visibility-test', '1');
      expect(visibilityFunctions.hasLocalStorage('visibility-test', 1)).toBe(false);
    });

    test('propagates unavailable storage to the item evaluation boundary', () => {
      jest.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new DOMException('Storage is unavailable', 'SecurityError');
      });

      expect(() => visibilityFunctions.hasLocalStorage('visibility-test', 'enabled')).toThrow('Storage is unavailable');
    });
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
      // Enable Kessel flag so the availability guard passes
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: (name: string) => name === 'platform.chrome.kessel' });
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
        }),
        { timeout: VISIBILITY_REQUEST_TIMEOUT_MS }
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
        }),
        { timeout: VISIBILITY_REQUEST_TIMEOUT_MS }
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
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/kessel/v1beta2/checkself', expect.objectContaining({ relation: 'rbac_roles_read' }), {
        timeout: VISIBILITY_REQUEST_TIMEOUT_MS,
      });
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

    test('should return false when ITLess is true (availability guard)', async () => {
      const mockedITLess = ITLess as jest.Mock;
      mockedITLess.mockReturnValueOnce(true);
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_read']);
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('should return false when Kessel flag is disabled (availability guard)', async () => {
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => false });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_read']);
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('should return false when Kessel flag client is unavailable (availability guard)', async () => {
      mockedGetUnleashClient.mockImplementation(() => {
        throw new Error('Unleash client not initialized');
      });
      const result = await visibilityFunctions.loosePermissionsKessel(['rbac_roles_read']);
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('isITLess', () => {
    const mockedITLess = ITLess as jest.Mock;

    afterEach(() => {
      mockedITLess.mockReset();
      mockedITLess.mockReturnValue(false);
    });

    test('should return true when expected=true and environment is ITLess', () => {
      mockedITLess.mockReturnValue(true);
      expect(visibilityFunctions.isITLess(true)).toBe(true);
    });

    test('should return false when expected=false and environment is ITLess', () => {
      mockedITLess.mockReturnValue(true);
      expect(visibilityFunctions.isITLess(false)).toBe(false);
    });

    test('should return true when expected=false and environment is not ITLess', () => {
      mockedITLess.mockReturnValue(false);
      expect(visibilityFunctions.isITLess(false)).toBe(true);
    });

    test('should return false when expected=true and environment is not ITLess', () => {
      mockedITLess.mockReturnValue(false);
      expect(visibilityFunctions.isITLess(true)).toBe(false);
    });
  });

  describe('featureFlag outage policy', () => {
    beforeEach(() => {
      mockedGetFeatureFlagsError.mockReset().mockReturnValue(true);
      mockedGetUnleashClient.mockReset();
    });

    test.each([
      [true, true, true],
      [true, false, false],
      [false, true, false],
      [false, false, true],
    ])('compares cached/default flag state %s against expected=%s', (enabled, expectedValue, result) => {
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => enabled });
      expect(visibilityFunctions.featureFlag('some.flag', expectedValue)).toBe(result);
    });

    test('uses the last successful toggle during an outage and the recovered value afterward', () => {
      let enabled = true;
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => enabled });
      mockedGetFeatureFlagsError.mockReturnValue(false);

      expect(visibilityFunctions.featureFlag('some.flag', true)).toBe(true);

      mockedGetFeatureFlagsError.mockReturnValue(true);
      expect(visibilityFunctions.featureFlag('some.flag', true)).toBe(true);

      enabled = false;
      mockedGetFeatureFlagsError.mockReturnValue(false);
      expect(visibilityFunctions.featureFlag('some.flag', true)).toBe(false);
    });

    test.each([true, false])('fails closed when the client is unavailable for expected=%s', (expectedValue) => {
      mockedGetUnleashClient.mockImplementation(() => {
        throw new Error('UnleashClient not initialized!');
      });
      expect(visibilityFunctions.featureFlag('some.flag', expectedValue)).toBe(false);
    });
  });

  describe('isKesselEnabled', () => {
    const mockedITLess = ITLess as jest.Mock;

    afterEach(() => {
      mockedITLess.mockReset();
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReset();
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReset();
    });

    test('should return false when ITLess=true regardless of flag', () => {
      mockedITLess.mockReturnValue(true);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => true });
      expect(visibilityFunctions.isKesselEnabled(true)).toBe(false);
    });

    test('should return true when ITLess=false and flag is enabled with expected=true', () => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: (name: string) => name === 'platform.chrome.kessel' });
      expect(visibilityFunctions.isKesselEnabled(true)).toBe(true);
    });

    test('should return false when ITLess=false and flag is disabled with expected=true', () => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => false });
      expect(visibilityFunctions.isKesselEnabled(true)).toBe(false);
    });

    test('should return true when expected=false inverts result (flag disabled)', () => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => false });
      expect(visibilityFunctions.isKesselEnabled(false)).toBe(true);
    });

    test('should return false when expected=false and flag is enabled', () => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: (name: string) => name === 'platform.chrome.kessel' });
      expect(visibilityFunctions.isKesselEnabled(false)).toBe(false);
    });

    test('uses the cached enabled value when feature flags have an error', () => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(true);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => true });
      expect(visibilityFunctions.isKesselEnabled(true)).toBe(true);
    });

    test.each([true, false])('should return false when unleash client is undefined with expected=%s', (expected) => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue(undefined);
      expect(visibilityFunctions.isKesselEnabled(expected)).toBe(false);
    });

    test('should return false when ITLess=true with expected=false', () => {
      mockedITLess.mockReturnValue(true);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => false });
      expect(visibilityFunctions.isKesselEnabled(false)).toBe(false);
    });

    test('uses the cached disabled value when feature flags have an error', () => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(true);
      mockedGetUnleashClient.mockReturnValue({ isEnabled: () => false });
      expect(visibilityFunctions.isKesselEnabled(false)).toBe(true);
    });

    test('should return false when getUnleashClient throws', () => {
      mockedITLess.mockReturnValue(false);
      mockedGetFeatureFlagsError.mockReturnValue(false);
      mockedGetUnleashClient.mockImplementation(() => {
        throw new Error('Unleash client not initialized');
      });
      expect(visibilityFunctions.isKesselEnabled(true)).toBe(false);
      expect(visibilityFunctions.isKesselEnabled(false)).toBe(false);
    });
  });

  describe('isKesselOrgOnboarded', () => {
    const mockedITLess = ITLess as jest.Mock;

    beforeEach(() => {
      mockedFetchOrgOptIn.mockReset();
      getUser.mockImplementation(() => Promise.resolve(userMock));
    });

    afterEach(() => {
      mockedITLess.mockReset();
      mockedITLess.mockReturnValue(false);
    });

    test('should return false when ITLess=true regardless of API result', async () => {
      mockedITLess.mockReturnValue(true);
      mockedFetchOrgOptIn.mockResolvedValue(true);
      expect(await visibilityFunctions.isKesselOrgOnboarded(true)).toBe(false);
      expect(mockedFetchOrgOptIn).not.toHaveBeenCalled();
    });

    test('should return true when API returns opted-in and expected=true', async () => {
      mockedFetchOrgOptIn.mockResolvedValue(true);
      expect(await visibilityFunctions.isKesselOrgOnboarded(true)).toBe(true);
      expect(mockedFetchOrgOptIn).toHaveBeenCalledWith('123');
    });

    test('should return false when API returns opted-in and expected=false', async () => {
      mockedFetchOrgOptIn.mockResolvedValue(true);
      expect(await visibilityFunctions.isKesselOrgOnboarded(false)).toBe(false);
    });

    test('should return false when API returns not opted-in and expected=true', async () => {
      mockedFetchOrgOptIn.mockResolvedValue(false);
      expect(await visibilityFunctions.isKesselOrgOnboarded(true)).toBe(false);
    });

    test('should return true when API returns not opted-in and expected=false', async () => {
      mockedFetchOrgOptIn.mockResolvedValue(false);
      expect(await visibilityFunctions.isKesselOrgOnboarded(false)).toBe(true);
    });

    test('should return false on API failure (null) for expected=true', async () => {
      mockedFetchOrgOptIn.mockResolvedValue(null);
      expect(await visibilityFunctions.isKesselOrgOnboarded(true)).toBe(false);
    });

    test('should return false on API failure (null) for expected=false', async () => {
      mockedFetchOrgOptIn.mockResolvedValue(null);
      expect(await visibilityFunctions.isKesselOrgOnboarded(false)).toBe(false);
    });

    test('should return false when ITLess=true with expected=false', async () => {
      mockedITLess.mockReturnValue(true);
      expect(await visibilityFunctions.isKesselOrgOnboarded(false)).toBe(false);
      expect(mockedFetchOrgOptIn).not.toHaveBeenCalled();
    });

    test('should return false when org_id is missing', async () => {
      getUser.mockImplementationOnce(() =>
        Promise.resolve({
          ...userMock,
          identity: { ...userMock.identity, org_id: undefined },
        })
      );
      expect(await visibilityFunctions.isKesselOrgOnboarded(true)).toBe(false);
      expect(mockedFetchOrgOptIn).not.toHaveBeenCalled();
    });

    test('should return false when fetchOrgOptIn throws', async () => {
      mockedFetchOrgOptIn.mockRejectedValue(new Error('unexpected'));
      expect(await visibilityFunctions.isKesselOrgOnboarded(true)).toBe(false);
    });

    test('should return false for malformed HTTP 200 response (null result) for expected=true', async () => {
      // Malformed response causes fetchOrgOptIn to return null
      mockedFetchOrgOptIn.mockResolvedValue(null);
      expect(await visibilityFunctions.isKesselOrgOnboarded(true)).toBe(false);
    });

    test('should return false for malformed HTTP 200 response (null result) for expected=false', async () => {
      // Malformed response causes fetchOrgOptIn to return null
      mockedFetchOrgOptIn.mockResolvedValue(null);
      expect(await visibilityFunctions.isKesselOrgOnboarded(false)).toBe(false);
    });
  });
});
