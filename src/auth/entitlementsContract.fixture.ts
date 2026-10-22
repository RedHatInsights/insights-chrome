import { EntitlementsMap } from './getMinimumViableEntitlements';

const orgIdEntitled = { is_entitled: true, is_trial: false } as const;
const skuFalse = { is_entitled: false, is_trial: false } as const;
const skuTrue = { is_entitled: true, is_trial: false } as const;

const orgIdBundles: EntitlementsMap = {
  insights: { ...orgIdEntitled },
  rhel: { ...orgIdEntitled },
  settings: { ...orgIdEntitled },
  subscriptions: { ...orgIdEntitled },
  cost_management: { ...orgIdEntitled },
  user_preferences: { ...orgIdEntitled },
  migrations: { ...orgIdEntitled },
  openshift: { ...orgIdEntitled },
  internal: { ...skuFalse },
};

const allSkuFalse: EntitlementsMap = {
  ansible: { ...skuFalse },
  acs: { ...skuFalse },
  rhods: { ...skuFalse },
  rhoam: { ...skuFalse },
  rhosak: { ...skuFalse },
  smart_management: { ...skuFalse },
};

/** Healthy 200: org with paid Ansible. No degraded header. */
export const healthyPaid: EntitlementsMap = {
  ...orgIdBundles,
  ...allSkuFalse,
  ansible: { ...skuTrue },
};

/** Healthy 200: org with no paid SKUs. Must not be treated as degraded. */
export const healthyUnsubscribed: EntitlementsMap = {
  ...orgIdBundles,
  ...allSkuFalse,
};

/** Failure A: Feature Service down. HTTP 200 + X-Entitlements-Degraded. Same SKU shape as unsubscribed. */
export const failureA: EntitlementsMap = {
  ...orgIdBundles,
  ...allSkuFalse,
};

export const DEGRADED_HEADERS = {
  'x-entitlements-degraded': 'true',
  'x-entitlements-degraded-status': '503',
};

export const orgIdUserProfile = {
  org_id: '12345',
  account_number: '1111111',
  email: 'user@example.com',
  is_internal: false,
};
