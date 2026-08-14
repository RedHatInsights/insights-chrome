import { act, renderHook } from '@testing-library/react';
import { useFlag } from '@unleash/proxy-client-react';
import { Provider, createStore } from 'jotai';
import React from 'react';
import { useDegradedState } from './useDegradedState';
import {
  degradedStateAtom,
  setConfigFromCacheDegradedAtom,
  setEntitlementsDegradedAtom,
  setFeatureFlagsDegradedAtom,
  setUserPersonalizationDegradedAtom,
} from '../state/atoms/degradedStateAtom';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
}));

const mockedUseFlag = useFlag as jest.Mock;

describe('useDegradedState', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: false,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });
    mockedUseFlag.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(Provider, { store }, children);

  it('should return initial state with all services healthy', () => {
    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current.serviceHealth).toEqual({
      userPersonalization: false,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });
    expect(result.current.isAnyServiceDegraded).toBe(false);
    expect(result.current.isBannerEnabled).toBe(false);
  });

  it('should return feature flag status from Unleash', () => {
    mockedUseFlag.mockReturnValue(true);

    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current.isBannerEnabled).toBe(true);
    expect(mockedUseFlag).toHaveBeenCalledWith('platform.chrome.degraded-state-banner');
  });

  it('should detect degraded user personalization service', () => {
    store.set(setUserPersonalizationDegradedAtom, true);

    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current.serviceHealth.userPersonalization).toBe(true);
    expect(result.current.isAnyServiceDegraded).toBe(true);
  });

  it('should detect degraded entitlements service', () => {
    store.set(setEntitlementsDegradedAtom, true);

    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current.serviceHealth.entitlements).toBe(true);
    expect(result.current.isAnyServiceDegraded).toBe(true);
  });

  it('should detect degraded config service', () => {
    store.set(setConfigFromCacheDegradedAtom, true);

    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current.serviceHealth.configFromCache).toBe(true);
    expect(result.current.isAnyServiceDegraded).toBe(true);
  });

  it('should detect degraded feature flags service', () => {
    store.set(setFeatureFlagsDegradedAtom, true);

    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current.serviceHealth.featureFlags).toBe(true);
    expect(result.current.isAnyServiceDegraded).toBe(true);
  });

  it('should provide setter for user personalization degraded state', () => {
    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(typeof result.current.setUserPersonalizationDegraded).toBe('function');

    act(() => {
      result.current.setUserPersonalizationDegraded(true);
    });

    expect(store.get(degradedStateAtom).userPersonalization).toBe(true);
  });

  it('should provide setter for entitlements degraded state', () => {
    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(typeof result.current.setEntitlementsDegraded).toBe('function');

    act(() => {
      result.current.setEntitlementsDegraded(true);
    });

    expect(store.get(degradedStateAtom).entitlements).toBe(true);
  });

  it('should provide setter for config degraded state', () => {
    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(typeof result.current.setConfigFromCacheDegraded).toBe('function');

    act(() => {
      result.current.setConfigFromCacheDegraded(true);
    });

    expect(store.get(degradedStateAtom).configFromCache).toBe(true);
  });

  it('should provide setter for feature flags degraded state', () => {
    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(typeof result.current.setFeatureFlagsDegraded).toBe('function');

    act(() => {
      result.current.setFeatureFlagsDegraded(true);
    });

    expect(store.get(degradedStateAtom).featureFlags).toBe(true);
  });

  it('should detect when multiple services are degraded', () => {
    store.set(setUserPersonalizationDegradedAtom, true);
    store.set(setEntitlementsDegradedAtom, true);
    store.set(setConfigFromCacheDegradedAtom, true);

    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current.serviceHealth.userPersonalization).toBe(true);
    expect(result.current.serviceHealth.entitlements).toBe(true);
    expect(result.current.serviceHealth.configFromCache).toBe(true);
    expect(result.current.isAnyServiceDegraded).toBe(true);
  });

  it('should allow toggling degraded state', () => {
    const { result } = renderHook(() => useDegradedState(), { wrapper });

    act(() => {
      result.current.setEntitlementsDegraded(true);
    });
    expect(store.get(degradedStateAtom).entitlements).toBe(true);

    act(() => {
      result.current.setEntitlementsDegraded(false);
    });
    expect(store.get(degradedStateAtom).entitlements).toBe(false);
  });

  it('should return DegradedStateAPI shape', () => {
    const { result } = renderHook(() => useDegradedState(), { wrapper });

    expect(result.current).toHaveProperty('serviceHealth');
    expect(result.current).toHaveProperty('isAnyServiceDegraded');
    expect(result.current).toHaveProperty('isBannerEnabled');
    expect(result.current).toHaveProperty('setUserPersonalizationDegraded');
    expect(result.current).toHaveProperty('setEntitlementsDegraded');
    expect(result.current).toHaveProperty('setConfigFromCacheDegraded');
    expect(result.current).toHaveProperty('setFeatureFlagsDegraded');
  });
});
