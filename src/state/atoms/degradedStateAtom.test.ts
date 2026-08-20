import { createStore } from 'jotai';
import { degradedStateAtom, isAnyServiceDegradedAtom, setServiceDegradedAtom } from './degradedStateAtom';

describe('degradedStateAtom', () => {
  it('should have initial state with all services healthy', () => {
    const store = createStore();
    const state = store.get(degradedStateAtom);
    expect(state).toEqual({
      userPersonalization: false,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });
  });

  it('should update userPersonalization status', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'userPersonalization', degraded: true });
    const state = store.get(degradedStateAtom);
    expect(state.userPersonalization).toBe(true);
    expect(state.entitlements).toBe(false);
    expect(state.configFromCache).toBe(false);
    expect(state.featureFlags).toBe(false);
  });

  it('should update entitlements status', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'entitlements', degraded: true });
    const state = store.get(degradedStateAtom);
    expect(state.userPersonalization).toBe(false);
    expect(state.entitlements).toBe(true);
    expect(state.configFromCache).toBe(false);
    expect(state.featureFlags).toBe(false);
  });

  it('should update configFromCache status', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'configFromCache', degraded: true });
    const state = store.get(degradedStateAtom);
    expect(state.userPersonalization).toBe(false);
    expect(state.entitlements).toBe(false);
    expect(state.configFromCache).toBe(true);
    expect(state.featureFlags).toBe(false);
  });

  it('should update featureFlags status', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'featureFlags', degraded: true });
    const state = store.get(degradedStateAtom);
    expect(state.userPersonalization).toBe(false);
    expect(state.entitlements).toBe(false);
    expect(state.configFromCache).toBe(false);
    expect(state.featureFlags).toBe(true);
  });

  it('should update multiple services independently', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'userPersonalization', degraded: true });
    store.set(setServiceDegradedAtom, { service: 'featureFlags', degraded: true });
    const state = store.get(degradedStateAtom);
    expect(state.userPersonalization).toBe(true);
    expect(state.entitlements).toBe(false);
    expect(state.configFromCache).toBe(false);
    expect(state.featureFlags).toBe(true);
  });

  it('should toggle service status', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'entitlements', degraded: true });
    expect(store.get(degradedStateAtom).entitlements).toBe(true);

    store.set(setServiceDegradedAtom, { service: 'entitlements', degraded: false });
    expect(store.get(degradedStateAtom).entitlements).toBe(false);
  });

  it('should detect when no services are degraded', () => {
    const store = createStore();
    expect(store.get(isAnyServiceDegradedAtom)).toBe(false);
  });

  it('should detect when any service is degraded', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'entitlements', degraded: true });
    expect(store.get(isAnyServiceDegradedAtom)).toBe(true);
  });

  it('should detect when multiple services are degraded', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'userPersonalization', degraded: true });
    store.set(setServiceDegradedAtom, { service: 'configFromCache', degraded: true });
    expect(store.get(isAnyServiceDegradedAtom)).toBe(true);
  });

  it('should detect when all services are degraded', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'userPersonalization', degraded: true });
    store.set(setServiceDegradedAtom, { service: 'entitlements', degraded: true });
    store.set(setServiceDegradedAtom, { service: 'configFromCache', degraded: true });
    store.set(setServiceDegradedAtom, { service: 'featureFlags', degraded: true });
    expect(store.get(isAnyServiceDegradedAtom)).toBe(true);
  });

  it('should detect when services recover', () => {
    const store = createStore();
    store.set(setServiceDegradedAtom, { service: 'entitlements', degraded: true });
    expect(store.get(isAnyServiceDegradedAtom)).toBe(true);

    store.set(setServiceDegradedAtom, { service: 'entitlements', degraded: false });
    expect(store.get(isAnyServiceDegradedAtom)).toBe(false);
  });
});
