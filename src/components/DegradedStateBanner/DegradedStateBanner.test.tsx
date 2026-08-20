import { render } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { describe, expect, it } from '@jest/globals';
import DegradedStateBanner from './DegradedStateBanner';
import { ServiceHealthStatus, degradedStateAtom } from '../../state/atoms/degradedStateAtom';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
}));

const mockedUseFlag = useFlag as jest.Mock;

describe('DegradedStateBanner', () => {
  const renderBanner = (
    degradedState: ServiceHealthStatus = {
      userPersonalization: false,
      entitlements: false,
      configFromCache: false,
      featureFlags: false,
    }
  ) => {
    const store = createStore();
    store.set(degradedStateAtom, degradedState);

    return {
      store,
      ...render(
        <Provider store={store}>
          <DegradedStateBanner />
        </Provider>
      ),
    };
  };

  beforeEach(() => {
    mockedUseFlag.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when all services are healthy', () => {
    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it('should render banner when userPersonalization is degraded', () => {
    const { container } = renderBanner({ userPersonalization: true, entitlements: false, configFromCache: false, featureFlags: false });

    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.textContent).toMatch(/core functionality is available/i);
    expect(container.textContent).toMatch(/try again later/i);
  });

  it('should render banner when entitlements are degraded', () => {
    const { container } = renderBanner({ userPersonalization: false, entitlements: true, configFromCache: false, featureFlags: false });

    expect(container.textContent).toMatch(/entitlements/i);
  });

  it('should render banner when configFromCache is degraded', () => {
    const { container } = renderBanner({ userPersonalization: false, entitlements: false, configFromCache: true, featureFlags: false });

    expect(container.textContent).toMatch(/navigation configuration/i);
  });

  it('should render banner when featureFlags are degraded', () => {
    const { container } = renderBanner({ userPersonalization: false, entitlements: false, configFromCache: false, featureFlags: true });

    expect(container.textContent).toMatch(/feature flags/i);
  });

  it('should list multiple degraded services', () => {
    const { container } = renderBanner({ userPersonalization: true, entitlements: true, configFromCache: false, featureFlags: false });

    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.textContent).toMatch(/entitlements/i);
  });

  it('should list all degraded services when all are degraded', () => {
    const { container } = renderBanner({ userPersonalization: true, entitlements: true, configFromCache: true, featureFlags: true });

    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.textContent).toMatch(/entitlements/i);
    expect(container.textContent).toMatch(/navigation configuration/i);
    expect(container.textContent).toMatch(/feature flags/i);
  });

  it('should always show warning variant', () => {
    const { container } = renderBanner({ userPersonalization: true, entitlements: false, configFromCache: false, featureFlags: false });

    // Verify warning variant (PatternFly v6 Banner)
    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.querySelector('[class*="pf-m-warning"]')).toBeInTheDocument();
  });

  it('should have accessible screen reader text', () => {
    renderBanner({ userPersonalization: true, entitlements: false, configFromCache: false, featureFlags: false });

    // PatternFly Banner adds sr-only text via screenReaderText prop
    expect(document.querySelector('.pf-v5-screen-reader, .pf-v6-screen-reader')).toBeInTheDocument();
  });

  it('should not render when feature flag disabled', () => {
    mockedUseFlag.mockReturnValue(false);
    const { container } = renderBanner({ userPersonalization: true, entitlements: false, configFromCache: false, featureFlags: false });

    expect(container.firstChild).toBeNull();
  });
});
