import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { createStore } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import DegradedStateBanner from './DegradedStateBanner';
import { degradedStateAtom } from '../../state/atoms/degradedStateAtom';
import { describe, expect, it } from '@jest/globals';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
}));

const mockedUseFlag = useFlag as jest.Mock;

describe('DegradedStateBanner', () => {
  beforeEach(() => {
    mockedUseFlag.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

    expect(screen.getByText(/user preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/core functionality is available/i)).toBeInTheDocument();
    expect(screen.getByText(/try again later/i)).toBeInTheDocument();
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

    expect(screen.getByText(/entitlements/i)).toBeInTheDocument();
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

    expect(screen.getByText(/navigation configuration/i)).toBeInTheDocument();
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

    expect(screen.getByText(/feature flags/i)).toBeInTheDocument();
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

    expect(screen.getByText(/user preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/entitlements/i)).toBeInTheDocument();
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

    expect(screen.getByText(/user preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/entitlements/i)).toBeInTheDocument();
    expect(screen.getByText(/navigation configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/feature flags/i)).toBeInTheDocument();
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
    expect(screen.getByText(/user preferences/i)).toBeInTheDocument();
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

  it('should not render when feature flag disabled', () => {
    mockedUseFlag.mockReturnValue(false);
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

    expect(container.firstChild).toBeNull();
  });
});
