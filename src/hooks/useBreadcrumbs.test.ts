import { renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { appBreadcrumbStorageAtom, appMountPathnameAtom, breadcrumbReplaceModeAtom } from '../state/atoms/breadcrumbAtom';
import useBreadcrumbs from './useBreadcrumbs';
import { useFlag } from '@unleash/proxy-client-react';
import React from 'react';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

describe('useBreadcrumbs', () => {
  let store: ReturnType<typeof createStore>;
  const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(Provider, { store }, children);

  beforeEach(() => {
    store = createStore();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add breadcrumb entry to storage', () => {
    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'), { wrapper });

    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.get('/insights/advisor/systems')).toEqual({ title: 'Systems', options: undefined });
  });

  it('should add breadcrumb with options', () => {
    const options = { state: { view: 'list' }, replace: true };
    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems', options), { wrapper });

    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.get('/insights/advisor/systems')).toEqual({ title: 'Systems', options });
  });

  it('should remove breadcrumb on unmount', () => {
    const { unmount } = renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'), { wrapper });

    let storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.has('/insights/advisor/systems')).toBe(true);

    unmount();

    storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.has('/insights/advisor/systems')).toBe(false);
  });

  it('should clean trailing slashes from pathname', () => {
    renderHook(() => useBreadcrumbs('/insights/advisor/systems/', 'Systems'), { wrapper });

    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.has('/insights/advisor/systems')).toBe(true);
    expect(storage.has('/insights/advisor/systems/')).toBe(false);
  });

  it('should clean wildcards from pathname', () => {
    renderHook(() => useBreadcrumbs('/insights/advisor/systems/*', 'Systems'), { wrapper });

    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.has('/insights/advisor/systems')).toBe(true);
  });

  it('should warn on invalid pathname (not starting with /)', () => {
    renderHook(() => useBreadcrumbs('insights/advisor/systems', 'Systems'), { wrapper });

    expect(console.warn).toHaveBeenCalledWith('[useBreadcrumbs] Invalid pathname "insights/advisor/systems" - must be absolute path starting with /');

    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.size).toBe(0);
  });

  it('should warn on empty pathname', () => {
    renderHook(() => useBreadcrumbs('', 'Systems'), { wrapper });

    expect(console.warn).toHaveBeenCalledWith('[useBreadcrumbs] Invalid pathname "" - must be absolute path starting with /');

    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.size).toBe(0);
  });

  it('should update storage when pathname changes', () => {
    const { rerender } = renderHook(({ pathname }) => useBreadcrumbs(pathname, 'Systems'), {
      wrapper,
      initialProps: { pathname: '/insights/advisor/systems' },
    });

    let storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.has('/insights/advisor/systems')).toBe(true);

    rerender({ pathname: '/insights/advisor/systems/123' });

    storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.has('/insights/advisor/systems')).toBe(false);
    expect(storage.has('/insights/advisor/systems/123')).toBe(true);
  });

  it('should update storage when title changes', () => {
    const { rerender } = renderHook(({ title }) => useBreadcrumbs('/insights/advisor/systems', title), {
      wrapper,
      initialProps: { title: 'Systems' },
    });

    let storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.get('/insights/advisor/systems')?.title).toBe('Systems');

    rerender({ title: 'All Systems' });

    storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.get('/insights/advisor/systems')?.title).toBe('All Systems');
  });

  it('should not update storage when feature flag disabled', () => {
    jest.mocked(useFlag).mockReturnValue(false);

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'), { wrapper });

    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.size).toBe(0);

    jest.mocked(useFlag).mockReturnValue(true);
  });

  it('should warn when replace mode is active (dev mode)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    store.set(breadcrumbReplaceModeAtom, true);

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'), { wrapper });

    expect(console.warn).toHaveBeenCalledWith('[useBreadcrumbs] Replace mode is active — incremental entries will be ignored. Use only one hook type per app.');

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when replace mode is active in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    store.set(breadcrumbReplaceModeAtom, true);

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'), { wrapper });

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

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems', { state: circularState }), { wrapper });

    expect(console.warn).toHaveBeenCalledWith(
      '[useBreadcrumbs] options.state contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    // Should still add breadcrumb despite circular ref
    const storage = store.get(appBreadcrumbStorageAtom);
    expect(storage.has('/insights/advisor/systems')).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn about circular refs in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const circularState: any = { foo: 'bar' };
    circularState.self = circularState;

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems', { state: circularState }), { wrapper });

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useBreadcrumbs] options.state contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("should warn when pathname doesn't start with app mount pathname in dev mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Set app mount pathname
    store.set(appMountPathnameAtom, '/insights/advisor');

    renderHook(() => useBreadcrumbs('/settings/rbac', 'RBAC'), { wrapper });

    expect(console.warn).toHaveBeenCalledWith(
      '[useBreadcrumbs] pathname "/settings/rbac" does not start with app mount pathname "/insights/advisor" - breadcrumbs should be scoped to your app\'s routes'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when pathname correctly starts with app mount pathname', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Set app mount pathname
    store.set(appMountPathnameAtom, '/insights/advisor');

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'), { wrapper });

    // Should not warn - pathname is correctly scoped
    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when appMountPathnameAtom is undefined', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // appMountPathnameAtom is undefined by default in new store

    renderHook(() => useBreadcrumbs('/insights/advisor/systems', 'Systems'), { wrapper });

    // Should not warn - no app mount means no validation
    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn in production mode even if pathname invalid', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Set app mount pathname
    store.set(appMountPathnameAtom, '/insights/advisor');

    renderHook(() => useBreadcrumbs('/settings/rbac', 'RBAC'), { wrapper });

    // Should not warn in production
    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });
});
