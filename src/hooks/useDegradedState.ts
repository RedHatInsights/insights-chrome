import { useAtomValue, useSetAtom } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { ServiceHealthStatus, degradedStateAtom, isAnyServiceDegradedAtom, setServiceDegradedAtom } from '../state/atoms/degradedStateAtom';

export type DegradedStateAPI = {
  // Read state
  serviceHealth: ServiceHealthStatus;
  isAnyServiceDegraded: boolean;
  isBannerEnabled: boolean;

  // Write state
  setServiceDegraded: (params: { service: keyof ServiceHealthStatus; degraded: boolean }) => void;
};

export const useDegradedState = (): DegradedStateAPI => {
  const serviceHealth = useAtomValue(degradedStateAtom);
  const isAnyServiceDegraded = useAtomValue(isAnyServiceDegradedAtom);
  const isBannerEnabled = useFlag('platform.chrome.degraded-state-banner');
  const setServiceDegraded = useSetAtom(setServiceDegradedAtom);

  return {
    serviceHealth,
    isAnyServiceDegraded,
    isBannerEnabled,
    setServiceDegraded,
  };
};
