import { atom } from 'jotai';

export type ServiceHealthStatus = {
  userPersonalization: boolean; // true = degraded
  entitlements: boolean;
  configFromCache: boolean;
  featureFlags: boolean;
};

const initialState: ServiceHealthStatus = {
  userPersonalization: false,
  entitlements: false,
  configFromCache: false,
  featureFlags: false,
};

export const degradedStateAtom = atom<ServiceHealthStatus>(initialState);

// Write-only atoms for updating individual services
export const setUserPersonalizationDegradedAtom = atom(null, (get, set, degraded: boolean) => {
  const current = get(degradedStateAtom);
  set(degradedStateAtom, { ...current, userPersonalization: degraded });
});

export const setEntitlementsDegradedAtom = atom(null, (get, set, degraded: boolean) => {
  const current = get(degradedStateAtom);
  set(degradedStateAtom, { ...current, entitlements: degraded });
});

export const setConfigFromCacheDegradedAtom = atom(null, (get, set, degraded: boolean) => {
  const current = get(degradedStateAtom);
  set(degradedStateAtom, { ...current, configFromCache: degraded });
});

export const setFeatureFlagsDegradedAtom = atom(null, (get, set, degraded: boolean) => {
  const current = get(degradedStateAtom);
  set(degradedStateAtom, { ...current, featureFlags: degraded });
});

// Helper to check if any service is degraded
export const isAnyServiceDegradedAtom = atom((get) => {
  const state = get(degradedStateAtom);
  return Object.values(state).some((degraded) => degraded);
});
