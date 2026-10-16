import { act, render } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { useFlag } from '@unleash/proxy-client-react';
import { describe, expect, it } from '@jest/globals';
import DegradedStateBanner from './DegradedStateBanner';
import { ServiceHealthStatus, degradedStateAtom, setServiceDegradedAtom } from '../../state/atoms/degradedStateAtom';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
}));

const mockedUseFlag = useFlag as jest.Mock;

const healthy = (overrides: Partial<ServiceHealthStatus> = {}): ServiceHealthStatus => ({
  userPersonalization: false,
  entitlements: false,
  configFromCache: false,
  featureFlags: false,
  quickstarts: false,
  ...overrides,
});

describe('DegradedStateBanner', () => {
  const renderBanner = (degradedState: ServiceHealthStatus = healthy()) => {
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
    const { container } = renderBanner(healthy({ userPersonalization: true }));

    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.textContent).toMatch(/core functionality is available/i);
    expect(container.textContent).toMatch(/try again later/i);
  });

  it('should render banner when entitlements are degraded', () => {
    const { container } = renderBanner(healthy({ entitlements: true }));

    expect(container.textContent).toMatch(/entitlements/i);
  });

  it('should render banner when configFromCache is degraded', () => {
    const { container } = renderBanner(healthy({ configFromCache: true }));

    expect(container.textContent).toMatch(/navigation configuration/i);
  });

  it('should render banner when featureFlags are degraded', () => {
    const { container } = renderBanner(healthy({ featureFlags: true }));

    expect(container.textContent).toMatch(/feature flags/i);
  });

  it('should render banner when quickstarts are degraded', () => {
    const { container } = renderBanner(healthy({ quickstarts: true }));

    expect(container.textContent).toMatch(/quick starts/i);
  });

  it('should list multiple degraded services', () => {
    const { container } = renderBanner(healthy({ userPersonalization: true, entitlements: true }));

    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.textContent).toMatch(/entitlements/i);
  });

  it('should list all degraded services when all are degraded', () => {
    const { container } = renderBanner(
      healthy({
        userPersonalization: true,
        entitlements: true,
        configFromCache: true,
        featureFlags: true,
        quickstarts: true,
      })
    );

    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.textContent).toMatch(/entitlements/i);
    expect(container.textContent).toMatch(/navigation configuration/i);
    expect(container.textContent).toMatch(/feature flags/i);
    expect(container.textContent).toMatch(/quick starts/i);
  });

  it('should always show warning variant', () => {
    const { container } = renderBanner(healthy({ userPersonalization: true }));

    expect(container.textContent).toMatch(/user preferences/i);
    expect(container.querySelector('[class*="pf-m-warning"]')).toBeInTheDocument();
  });

  it('should have accessible screen reader text', () => {
    renderBanner(healthy({ userPersonalization: true }));

    expect(document.querySelector('.pf-v5-screen-reader, .pf-v6-screen-reader')).toBeInTheDocument();
  });

  it('should not render when feature flag disabled', () => {
    mockedUseFlag.mockReturnValue(false);
    const { container } = renderBanner(healthy({ userPersonalization: true }));

    expect(container.firstChild).toBeNull();
  });

  it.each(['navigation', 'serviceTiles'] as const)('reports %s as Navigation and respects the banner flag', (service) => {
    const state = healthy({ [service]: true });
    const { container, unmount } = renderBanner(state);
    expect(container.querySelector('strong')).toHaveTextContent(/^Navigation$/);
    expect(container.textContent).not.toContain('All Services');
    expect(container.textContent).not.toContain('Navigation Configuration');
    unmount();

    mockedUseFlag.mockReturnValue(false);
    expect(renderBanner(state).container.firstChild).toBeNull();
  });

  it('lists Navigation only once when both navigation and service tiles are degraded', () => {
    const { container } = renderBanner(healthy({ navigation: true, serviceTiles: true }));

    expect(container.querySelector('strong')).toHaveTextContent(/^Navigation$/);
    expect(container.querySelector('.pf-v6-screen-reader')).toHaveTextContent(
      'Core functionality is available, but some services are degraded: Navigation. Try again later.'
    );
    expect(container.textContent).not.toContain('All Services');
  });

  it.each(['navigation', 'serviceTiles'] as const)('keeps the shared label after %s recovers until both sources are healthy', (service) => {
    const { container, store } = renderBanner(healthy({ navigation: true, serviceTiles: true }));

    act(() => store.set(setServiceDegradedAtom, { service, degraded: false }));
    expect(container.querySelector('strong')).toHaveTextContent(/^Navigation$/);

    const otherService = service === 'navigation' ? 'serviceTiles' : 'navigation';
    expect(store.get(degradedStateAtom)[otherService]).toBe(true);
    act(() => store.set(setServiceDegradedAtom, { service: otherService, degraded: false }));
    expect(container.firstChild).toBeNull();
  });

  it('preserves unrelated degraded services after navigation and service tiles recover', () => {
    const { container, store } = renderBanner(healthy({ configFromCache: true, quickstarts: true, navigation: true, serviceTiles: true }));
    expect(container.querySelector('strong')).toHaveTextContent(/^Navigation Configuration, Quick starts, Navigation$/);

    act(() => {
      store.set(setServiceDegradedAtom, { service: 'navigation', degraded: false });
      store.set(setServiceDegradedAtom, { service: 'serviceTiles', degraded: false });
    });
    expect(container.querySelector('strong')).toHaveTextContent(/^Navigation Configuration, Quick starts$/);

    act(() => store.set(setServiceDegradedAtom, { service: 'configFromCache', degraded: false }));
    expect(container.querySelector('strong')).toHaveTextContent(/^Quick starts$/);
    act(() => store.set(setServiceDegradedAtom, { service: 'quickstarts', degraded: false }));
    expect(container.firstChild).toBeNull();
  });
});
