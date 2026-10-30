import {
  ORG_ID_BUNDLE_KEYS,
  SKU_BUNDLE_KEYS,
  countEntitledSkus,
  getMinimumViableEntitlements,
  isEntitlementsMap,
  shouldPersistEntitlements,
} from './getMinimumViableEntitlements';
import { failureA, healthyPaid, healthyUnsubscribed } from './entitlementsContract.fixture';

const orgProfile = {
  org_id: '12345',
  account_number: '1111111',
  email: 'user@example.com',
  is_internal: false,
};

describe('getMinimumViableEntitlements', () => {
  it('returns {} when org_id is missing', () => {
    expect(getMinimumViableEntitlements({ profile: { ...orgProfile, org_id: undefined } })).toEqual({});
    expect(getMinimumViableEntitlements({ profile: {} })).toEqual({});
  });

  it('entitles every org-id bundle and emits every SKU key as explicit false', () => {
    const result = getMinimumViableEntitlements({ profile: orgProfile });

    for (const key of ORG_ID_BUNDLE_KEYS) {
      expect(result[key]).toEqual({ is_entitled: true, is_trial: false });
    }
    for (const key of SKU_BUNDLE_KEYS) {
      expect(result[key]).toEqual({ is_entitled: false, is_trial: false });
      expect(result[key]).toBeDefined();
    }
    expect(result.ansible).toEqual({ is_entitled: false, is_trial: false });
    expect(result.internal).toEqual({ is_entitled: false, is_trial: false });
  });

  it('sets internal true only for valid account + is_internal + @redhat.com email', () => {
    expect(
      getMinimumViableEntitlements({
        profile: { ...orgProfile, is_internal: true, email: 'hossam@redhat.com' },
      }).internal.is_entitled
    ).toBe(true);

    expect(
      getMinimumViableEntitlements({
        profile: { ...orgProfile, is_internal: true, email: 'hossam@gmail.com' },
      }).internal.is_entitled
    ).toBe(false);

    expect(
      getMinimumViableEntitlements({
        profile: { ...orgProfile, is_internal: true, email: 'hossam@redhat.com', account_number: '-1' },
      }).internal.is_entitled
    ).toBe(false);

    expect(
      getMinimumViableEntitlements({
        profile: { ...orgProfile, is_internal: true, email: 'hossam@redhat.com', account_number: '' },
      }).internal.is_entitled
    ).toBe(false);

    expect(
      getMinimumViableEntitlements({
        profile: { ...orgProfile, is_internal: false, email: 'hossam@redhat.com' },
      }).internal.is_entitled
    ).toBe(false);
  });
});

describe('shouldPersistEntitlements', () => {
  it('always persists a healthy live body', () => {
    expect(shouldPersistEntitlements(healthyUnsubscribed, healthyPaid, false)).toBe(true);
  });

  it('does not overwrite a richer SKU cache with a degraded all-false body', () => {
    expect(shouldPersistEntitlements(failureA, healthyPaid, true)).toBe(false);
  });

  it('persists a degraded body when there is no cache', () => {
    expect(shouldPersistEntitlements(failureA, null, true)).toBe(true);
  });
});

describe('countEntitledSkus', () => {
  it('counts paid SKU keys only', () => {
    expect(countEntitledSkus(healthyPaid)).toBe(1);
    expect(countEntitledSkus(healthyUnsubscribed)).toBe(0);
    expect(countEntitledSkus(null)).toBe(0);
  });
});

describe('isEntitlementsMap', () => {
  it('rejects empty objects, arrays, and non-objects', () => {
    expect(isEntitlementsMap({})).toBe(false);
    expect(isEntitlementsMap([])).toBe(false);
    expect(isEntitlementsMap(null)).toBe(false);
    expect(isEntitlementsMap('nope')).toBe(false);
  });

  it('accepts a map with is_entitled booleans', () => {
    expect(isEntitlementsMap(healthyPaid)).toBe(true);
    expect(isEntitlementsMap({ insights: { is_entitled: true } })).toBe(true);
  });
});
