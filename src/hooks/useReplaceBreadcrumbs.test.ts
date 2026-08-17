import { renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { appBreadcrumbOverrideAtom, appBreadcrumbStorageAtom, appMountPathnameAtom, breadcrumbReplaceModeAtom } from '../state/atoms/breadcrumbAtom';
import useReplaceBreadcrumbs from './useReplaceBreadcrumbs';
import { useFlag } from '@unleash/proxy-client-react';
import React from 'react';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

describe('useReplaceBreadcrumbs', () => {
  let store: ReturnType<typeof createStore>;
  const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(Provider, { store }, children);

  beforeEach(() => {
    store = createStore();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should enable replace mode', () => {
    const breadcrumbs = [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    const isReplaceMode = store.get(breadcrumbReplaceModeAtom);
    expect(isReplaceMode).toBe(true);
  });

  it('should set override array', () => {
    const breadcrumbs = [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    const override = store.get(appBreadcrumbOverrideAtom);
    expect(override).toEqual(breadcrumbs);
  });

  it('should set breadcrumbs with options', () => {
    const breadcrumbs = [
      {
        pathname: '/insights/advisor/systems',
        title: 'Systems',
        options: { state: { view: 'list' } },
      },
      {
        pathname: '/insights/advisor/systems/123',
        title: 'System 123',
        options: { state: { filters: { status: 'active' } } },
      },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    const override = store.get(appBreadcrumbOverrideAtom);
    expect(override).toEqual(breadcrumbs);
  });

  it('should disable replace mode on unmount', () => {
    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];

    const { unmount } = renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(store.get(breadcrumbReplaceModeAtom)).toBe(true);

    unmount();

    expect(store.get(breadcrumbReplaceModeAtom)).toBe(false);
  });

  it('should clear override array on unmount', () => {
    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];

    const { unmount } = renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(store.get(appBreadcrumbOverrideAtom)).toEqual(breadcrumbs);

    unmount();

    expect(store.get(appBreadcrumbOverrideAtom)).toEqual([]);
  });

  it('should update override when breadcrumbs change', () => {
    const initialBreadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];

    const { rerender } = renderHook(({ breadcrumbs }) => useReplaceBreadcrumbs(breadcrumbs), {
      wrapper,
      initialProps: { breadcrumbs: initialBreadcrumbs },
    });

    expect(store.get(appBreadcrumbOverrideAtom)).toEqual(initialBreadcrumbs);

    const updatedBreadcrumbs = [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ];

    rerender({ breadcrumbs: updatedBreadcrumbs });

    expect(store.get(appBreadcrumbOverrideAtom)).toEqual(updatedBreadcrumbs);
  });

  it('should handle empty breadcrumbs array', () => {
    renderHook(() => useReplaceBreadcrumbs([]), { wrapper });

    expect(store.get(breadcrumbReplaceModeAtom)).toBe(true);
    expect(store.get(appBreadcrumbOverrideAtom)).toEqual([]);
  });

  it('should not update state when feature flag disabled', () => {
    jest.mocked(useFlag).mockReturnValue(false);

    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(store.get(breadcrumbReplaceModeAtom)).toBe(false);
    expect(store.get(appBreadcrumbOverrideAtom)).toEqual([]);

    jest.mocked(useFlag).mockReturnValue(true);
  });

  it('should warn when incremental storage exists (dev mode)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Simulate incremental breadcrumbs storage
    store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', { title: 'Systems' }]]));

    const breadcrumbs = [{ pathname: '/insights/advisor/systems/123', title: 'System 123' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(console.warn).toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] Incremental breadcrumb storage exists — it will be ignored. Use only one hook type per app.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when incremental storage exists in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', { title: 'Systems' }]]));

    const breadcrumbs = [{ pathname: '/insights/advisor/systems/123', title: 'System 123' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] Incremental breadcrumb storage exists — it will be ignored. Use only one hook type per app.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when storage is empty', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] Incremental breadcrumb storage exists — it will be ignored. Use only one hook type per app.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle circular references in breadcrumbs gracefully (dev mode)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Create circular reference in options.state
    const circularState: any = { foo: 'bar' };
    circularState.self = circularState;

    const breadcrumbs = [
      {
        pathname: '/insights/advisor/systems',
        title: 'Systems',
        options: { state: circularState },
      },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(console.warn).toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] breadcrumbs array contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    // Should still set breadcrumbs despite circular ref
    expect(store.get(breadcrumbReplaceModeAtom)).toBe(true);
    expect(store.get(appBreadcrumbOverrideAtom)).toEqual(breadcrumbs);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn about circular refs in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const circularState: any = { foo: 'bar' };
    circularState.self = circularState;

    const breadcrumbs = [
      {
        pathname: '/insights/advisor/systems',
        title: 'Systems',
        options: { state: circularState },
      },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] breadcrumbs array contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("should warn when any breadcrumb pathname doesn't start with app mount pathname in dev mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Set app mount pathname
    store.set(appMountPathnameAtom, '/insights/advisor');

    const breadcrumbs = [{ pathname: '/settings/rbac', title: 'RBAC' }];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    expect(console.warn).toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] breadcrumb pathname "/settings/rbac" does not start with app mount pathname "/insights/advisor" - breadcrumbs should be scoped to your app\'s routes'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when all pathnames correctly start with app mount pathname', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Set app mount pathname
    store.set(appMountPathnameAtom, '/insights/advisor');

    const breadcrumbs = [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs), { wrapper });

    // Should not warn - all pathnames are correctly scoped
    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });
});
