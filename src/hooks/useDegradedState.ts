import { useAtomValue, useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import {
  ServiceHealthStatus,
  degradedStateAtom,
  isAnyServiceDegradedAtom,
  setConfigFromCacheDegradedAtom,
  setEntitlementsDegradedAtom,
  setFeatureFlagsDegradedAtom,
  setUserPersonalizationDegradedAtom,
} from '../state/atoms/degradedStateAtom';

export type DegradedStateAPI = {
  // Read state
  serviceHealth: ServiceHealthStatus;
  isAnyServiceDegraded: boolean;
  isBannerEnabled: boolean;

  // Write state
  setUserPersonalizationDegraded: (degraded: boolean) => void;
  setEntitlementsDegraded: (degraded: boolean) => void;
  setConfigFromCacheDegraded: (degraded: boolean) => void;
  setFeatureFlagsDegraded: (degraded: boolean) => void;
};

export const useDegradedState = (): DegradedStateAPI => {
  const serviceHealth = useAtomValue(degradedStateAtom);
  const isAnyServiceDegraded = useAtomValue(isAnyServiceDegradedAtom);
  const isBannerEnabled = useFlag('platform.chrome.degraded-state-banner');

  const setUserPersonalizationDegraded = useSetAtom(setUserPersonalizationDegradedAtom);
  const setEntitlementsDegraded = useSetAtom(setEntitlementsDegradedAtom);
  const setConfigFromCacheDegraded = useSetAtom(setConfigFromCacheDegradedAtom);
  const setFeatureFlagsDegraded = useSetAtom(setFeatureFlagsDegradedAtom);

  return {
    serviceHealth,
    isAnyServiceDegraded,
    isBannerEnabled,
    setUserPersonalizationDegraded,
    setEntitlementsDegraded,
    setConfigFromCacheDegraded,
    setFeatureFlagsDegraded,
  };
};
