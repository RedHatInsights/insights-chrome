import { atom } from 'jotai';

export type ServiceHealthStatus = {
  userPersonalization: boolean; // true = degraded
  entitlements: boolean;
  configFromCache: boolean;
  featureFlags: boolean;
  // Optional for consumers constructing health snapshots against older Chrome versions.
  navigation?: boolean;
  serviceTiles?: boolean;
};

const initialState: ServiceHealthStatus = {
  userPersonalization: false,
  entitlements: false,
  configFromCache: false,
  featureFlags: false,
  navigation: false,
  serviceTiles: false,
};

export const degradedStateAtom = atom<ServiceHealthStatus>(initialState);

// Generic write-only atom for updating any service
export const setServiceDegradedAtom = atom(null, (get, set, { service, degraded }: { service: keyof ServiceHealthStatus; degraded: boolean }) => {
  const current = get(degradedStateAtom);
  set(degradedStateAtom, { ...current, [service]: degraded });
});

// Helper to check if any service is degraded
export const isAnyServiceDegradedAtom = atom((get) => {
  const state = get(degradedStateAtom);
  return Object.values(state).some((degraded) => degraded);
});
