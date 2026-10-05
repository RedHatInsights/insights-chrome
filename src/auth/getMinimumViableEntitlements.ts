import { ChromeUser } from '@redhat-cloud-services/types';

export type EntitlementsMap = ChromeUser['entitlements'];

export type EntitlementsUserProfile = {
  org_id?: unknown;
  account_number?: unknown;
  email?: unknown;
  is_internal?: unknown;
};

/**
 * Prod bundle keys from entitlements-config `configs/prod/bundles.yml`.
 * Org-id / always-on bundles are granted to any valid org (openshift to any authenticated caller).
 */
export const ORG_ID_BUNDLE_KEYS = ['insights', 'rhel', 'settings', 'subscriptions', 'cost_management', 'user_preferences', 'migrations', 'openshift'] as const;

/** SKU-gated bundles — never fail-open in the browser. */
export const SKU_BUNDLE_KEYS = ['ansible', 'acs', 'rhods', 'rhoam', 'rhosak', 'smart_management'] as const;

const entitled = { is_entitled: true, is_trial: false } as const;
const notEntitled = { is_entitled: false, is_trial: false } as const;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isValidAccountNumber(accountNumber: string): boolean {
  return accountNumber !== '' && accountNumber !== '-1';
}

function isInternalEntitled(profile: EntitlementsUserProfile): boolean {
  const accountNumber = asString(profile.account_number);
  const email = asString(profile.email);
  return Boolean(isValidAccountNumber(accountNumber) && profile.is_internal === true && /@redhat\.com$/i.test(email));
}

/**
 * Option B (RHCLOUD-50161): no-cache fallback when the JWT has `org_id`.
 * Org-id bundles entitled; SKU keys explicit false so Ansible trial redirect still runs.
 */
export function getMinimumViableEntitlements(user: { profile?: EntitlementsUserProfile }): EntitlementsMap {
  const profile = user.profile ?? {};
  if (!profile.org_id) {
    return {};
  }

  const entitlements: EntitlementsMap = {};
  for (const key of ORG_ID_BUNDLE_KEYS) {
    entitlements[key] = { ...entitled };
  }
  for (const key of SKU_BUNDLE_KEYS) {
    entitlements[key] = { ...notEntitled };
  }
  entitlements.internal = { is_entitled: isInternalEntitled(profile), is_trial: false };
  return entitlements;
}

export function countEntitledSkus(entitlements: EntitlementsMap | null): number {
  if (!entitlements) {
    return 0;
  }
  return SKU_BUNDLE_KEYS.filter((key) => entitlements[key]?.is_entitled === true).length;
}

export function shouldPersistEntitlements(live: EntitlementsMap, cached: EntitlementsMap | null, liveDegraded: boolean): boolean {
  if (!liveDegraded) {
    return true;
  }
  return countEntitledSkus(live) >= countEntitledSkus(cached);
}

export function isEntitlementsMap(data: unknown): data is EntitlementsMap {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }
  const values = Object.values(data);
  if (values.length === 0) {
    return false;
  }
  return values.every((value) => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    return typeof (value as { is_entitled?: unknown }).is_entitled === 'boolean';
  });
}

export function isNonEmptyEntitlementsMap(data: EntitlementsMap | undefined): data is EntitlementsMap {
  return Boolean(data && Object.keys(data).length > 0);
}
