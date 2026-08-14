import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { createStore } from 'jotai';
import DegradedStateBanner from './DegradedStateBanner';
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('DegradedStateBanner', () => {
  it('should not render when all services are healthy', () => {
    const store = createStore();
    const { container } = render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render banner when userPersonalization is degraded', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });

    render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    expect(screen.getByText(/user preferences/)).toBeInTheDocument();
    expect(screen.getByText(/core functionality is available/i)).toBeInTheDocument();
  });

  it('should render banner when entitlements are degraded', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: false,
      entitlements: true,
      configFromCache: false,
      featureFlags: false,
    });

    render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    expect(screen.getByText(/entitlements/)).toBeInTheDocument();
  });

  it('should render banner when configFromCache is degraded', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: false,
      entitlements: false,
      configFromCache: true,
      featureFlags: false,
    });

    render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    expect(screen.getByText(/navigation configuration/)).toBeInTheDocument();
  });

  it('should render banner when featureFlags are degraded', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: false,
      entitlements: false,
      configFromCache: false,
      featureFlags: true,
    });

    render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    expect(screen.getByText(/feature flags/)).toBeInTheDocument();
  });

  it('should list multiple degraded services', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: true,
      configFromCache: false,
      featureFlags: false,
    });

    render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    expect(screen.getByText(/user preferences/)).toBeInTheDocument();
    expect(screen.getByText(/entitlements/)).toBeInTheDocument();
  });

  it('should list all degraded services when all are degraded', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: true,
      configFromCache: true,
      featureFlags: true,
    });

    render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    expect(screen.getByText(/user preferences/)).toBeInTheDocument();
    expect(screen.getByText(/entitlements/)).toBeInTheDocument();
    expect(screen.getByText(/navigation configuration/)).toBeInTheDocument();
    expect(screen.getByText(/feature flags/)).toBeInTheDocument();
  });

  it('should always show warning variant', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });

    const { container } = render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    // Verify warning variant (PatternFly v6 Banner)
    expect(screen.getByText(/user preferences/)).toBeInTheDocument();
    expect(container.querySelector('[class*="pf-m-warning"]')).toBeInTheDocument();
  });

  it('should have accessible screen reader text', () => {
    const store = createStore();
    store.set(degradedStateAtom, {
      userPersonalization: true,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    });

    render(
      <Provider store={store}>
        <DegradedStateBanner />
      </Provider>
    );

    // PatternFly Banner adds sr-only text via screenReaderText prop
    expect(document.querySelector('.pf-v5-screen-reader, .pf-v6-screen-reader')).toBeInTheDocument();
  });
});
