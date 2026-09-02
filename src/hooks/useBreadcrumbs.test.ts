import { renderHook } from '@testing-library/react';
import { _resetBreadcrumbStore, getBreadcrumbStore } from '../state/stores/breadcrumbStore';
import useBreadcrumbs from './useBreadcrumbs';
import { useFlag } from '@unleash/proxy-client-react';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

const getStorage = () => getBreadcrumbStore().getState().storage;

describe('useBreadcrumbs', () => {
  beforeEach(() => {
    _resetBreadcrumbStore();
    jest.mocked(useFlag).mockReturnValue(true);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add breadcrumb entry to storage', () => {
    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'));

    expect(getStorage().get('/insights/advisor/systems')).toEqual({ title: 'Systems', options: undefined });
  });

  it('should add breadcrumb with options', () => {
    const options = { state: { view: 'list' }, replace: true };
    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems', options));

    expect(getStorage().get('/insights/advisor/systems')).toEqual({ title: 'Systems', options });
  });

  it('should remove breadcrumb on unmount', () => {
    const { unmount } = renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'));

    expect(getStorage().has('/insights/advisor/systems')).toBe(true);

    unmount();

    expect(getStorage().has('/insights/advisor/systems')).toBe(false);
  });

  it('should clean trailing slashes from pathname', () => {
    renderHook(() => useBreadcrumbs('/insights/advisor/systems/', 'Systems'));

    expect(getStorage().has('/insights/advisor/systems')).toBe(true);
    expect(getStorage().has('/insights/advisor/systems/')).toBe(false);
  });

  it('should clean wildcards from pathname', () => {
    renderHook(() => useBreadcrumbs('/insights/advisor/systems/*', 'Systems'));

    expect(getStorage().has('/insights/advisor/systems')).toBe(true);
  });

  it('should warn on invalid pathname (not starting with /)', () => {
    renderHook(() => useBreadcrumbs('insights/advisor/systems', 'Systems'));

    expect(console.warn).toHaveBeenCalledWith('[useBreadcrumbs] Invalid pathname "insights/advisor/systems" - must be absolute path starting with /');

    expect(getStorage().size).toBe(0);
  });

  it('should warn on empty pathname', () => {
    renderHook(() => useBreadcrumbs('', 'Systems'));

    expect(console.warn).toHaveBeenCalledWith('[useBreadcrumbs] Invalid pathname "" - must be absolute path starting with /');

    expect(getStorage().size).toBe(0);
  });

  it('should update storage when pathname changes', () => {
    const { rerender } = renderHook(({ pathname }) => useBreadcrumbs(pathname, 'Systems'), {
      initialProps: { pathname: '/insights/advisor/systems' },
    });

    expect(getStorage().has('/insights/advisor/systems')).toBe(true);

    rerender({ pathname: '/insights/advisor/systems/123' });

    expect(getStorage().has('/insights/advisor/systems')).toBe(false);
    expect(getStorage().has('/insights/advisor/systems/123')).toBe(true);
  });

  it('should update storage when title changes', () => {
    const { rerender } = renderHook(({ title }) => useBreadcrumbs('/insights/advisor/systems', title), {
      initialProps: { title: 'Systems' },
    });

    expect(getStorage().get('/insights/advisor/systems')?.title).toBe('Systems');

    rerender({ title: 'All Systems' });

    expect(getStorage().get('/insights/advisor/systems')?.title).toBe('All Systems');
  });

  it('should not update storage when feature flag disabled', () => {
    jest.mocked(useFlag).mockReturnValue(false);

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'));

    expect(getStorage().size).toBe(0);
  });

  it('should warn when replace mode is active (dev mode)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    getBreadcrumbStore().updateState('SET_REPLACE_MODE', true);

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'));

    expect(console.warn).toHaveBeenCalledWith('[useBreadcrumbs] Replace mode is active — incremental entries will be ignored. Use only one hook type per app.');

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when replace mode is active in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    getBreadcrumbStore().updateState('SET_REPLACE_MODE', true);

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'));

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useBreadcrumbs] Replace mode is active — incremental entries will be ignored. Use only one hook type per app.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle circular references in options.state gracefully (dev mode)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Create circular reference
    const circularState: any = { foo: 'bar' };
    circularState.self = circularState;

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems', { state: circularState }));

    expect(console.warn).toHaveBeenCalledWith(
      '[useBreadcrumbs] options.state contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    // Should still add breadcrumb despite circular ref
    expect(getStorage().has('/insights/advisor/systems')).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn about circular refs in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const circularState: any = { foo: 'bar' };
    circularState.self = circularState;

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems', { state: circularState }));

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useBreadcrumbs] options.state contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("should warn when pathname doesn't start with app mount pathname in dev mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    getBreadcrumbStore().updateState('SET_APP_MOUNT_PATHNAME', '/insights/advisor');

    renderHook(() => useBreadcrumbs('/settings/rbac', 'RBAC'));

    expect(console.warn).toHaveBeenCalledWith(
      '[useBreadcrumbs] pathname "/settings/rbac" does not start with app mount pathname "/insights/advisor" - breadcrumbs should be scoped to your app\'s routes'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when pathname correctly starts with app mount pathname', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    getBreadcrumbStore().updateState('SET_APP_MOUNT_PATHNAME', '/insights/advisor');

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'));

    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when appMountPathname is undefined', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // appMountPathname is undefined by default in a fresh store

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'));

    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn in production mode even if pathname invalid', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    getBreadcrumbStore().updateState('SET_APP_MOUNT_PATHNAME', '/insights/advisor');

    renderHook(() => useBreadcrumbs('/settings/rbac', 'RBAC'));

    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });
});
