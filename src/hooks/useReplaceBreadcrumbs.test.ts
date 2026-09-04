import { renderHook } from '@testing-library/react';
import { _resetBreadcrumbStore, getBreadcrumbStore } from '../state/stores/breadcrumbStore';
import useReplaceBreadcrumbs from './useReplaceBreadcrumbs';
import { useFlag } from '@unleash/proxy-client-react';

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

const getState = () => getBreadcrumbStore().getState();

describe('useReplaceBreadcrumbs', () => {
  beforeEach(() => {
    _resetBreadcrumbStore();
    jest.mocked(useFlag).mockReturnValue(true);
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

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(getState().replaceMode).toBe(true);
  });

  it('should set override array', () => {
    const breadcrumbs = [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(getState().override).toEqual(breadcrumbs);
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

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(getState().override).toEqual(breadcrumbs);
  });

  it('should set and clear the drop-final Chrome segment option', () => {
    const breadcrumbs = [{ pathname: '/lightwell', title: 'Lightwell Repositories' }];

    const { unmount } = renderHook(() => useReplaceBreadcrumbs(breadcrumbs, { dropLastChromeSegment: true }));

    expect(getState().dropLastChromeSegment).toBe(true);

    unmount();

    expect(getState().dropLastChromeSegment).toBe(false);
  });

  it('should disable replace mode on unmount', () => {
    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];

    const { unmount } = renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(getState().replaceMode).toBe(true);

    unmount();

    expect(getState().replaceMode).toBe(false);
  });

  it('should clear override array on unmount', () => {
    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];

    const { unmount } = renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(getState().override).toEqual(breadcrumbs);

    unmount();

    expect(getState().override).toEqual([]);
  });

  it('should update override when breadcrumbs change', () => {
    const initialBreadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];

    const { rerender } = renderHook(({ breadcrumbs }) => useReplaceBreadcrumbs(breadcrumbs), {
      initialProps: { breadcrumbs: initialBreadcrumbs },
    });

    expect(getState().override).toEqual(initialBreadcrumbs);

    const updatedBreadcrumbs = [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ];

    rerender({ breadcrumbs: updatedBreadcrumbs });

    expect(getState().override).toEqual(updatedBreadcrumbs);
  });

  it('should handle empty breadcrumbs array', () => {
    renderHook(() => useReplaceBreadcrumbs([]));

    expect(getState().replaceMode).toBe(true);
    expect(getState().override).toEqual([]);
  });

  it('should not update state when feature flag disabled', () => {
    jest.mocked(useFlag).mockReturnValue(false);

    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(getState().replaceMode).toBe(false);
    expect(getState().override).toEqual([]);
  });

  it('should warn when incremental storage exists (dev mode)', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Simulate incremental breadcrumbs storage
    getBreadcrumbStore().updateState('SET_BREADCRUMB', { pathname: '/insights/advisor/systems', entry: { title: 'Systems' } });

    const breadcrumbs = [{ pathname: '/insights/advisor/systems/123', title: 'System 123' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(console.warn).toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] Incremental breadcrumb storage exists — it will be ignored. Use only one hook type per app.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when incremental storage exists in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    getBreadcrumbStore().updateState('SET_BREADCRUMB', { pathname: '/insights/advisor/systems', entry: { title: 'Systems' } });

    const breadcrumbs = [{ pathname: '/insights/advisor/systems/123', title: 'System 123' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] Incremental breadcrumb storage exists — it will be ignored. Use only one hook type per app.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when storage is empty', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const breadcrumbs = [{ pathname: '/insights/advisor/systems', title: 'Systems' }];
    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

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

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(console.warn).toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] breadcrumbs array contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    // Should still set breadcrumbs despite circular ref
    expect(getState().replaceMode).toBe(true);
    expect(getState().override).toEqual(breadcrumbs);

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

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(console.warn).not.toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] breadcrumbs array contains circular references — using object reference for comparison. This may cause extra re-renders.'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("should warn when any breadcrumb pathname doesn't start with app mount pathname in dev mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    getBreadcrumbStore().updateState('SET_APP_MOUNT_PATHNAME', '/insights/advisor');

    const breadcrumbs = [{ pathname: '/settings/rbac', title: 'RBAC' }];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    expect(console.warn).toHaveBeenCalledWith(
      '[useReplaceBreadcrumbs] breadcrumb pathname "/settings/rbac" does not start with app mount pathname "/insights/advisor" - breadcrumbs should be scoped to your app\'s routes'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn when all pathnames correctly start with app mount pathname', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    getBreadcrumbStore().updateState('SET_APP_MOUNT_PATHNAME', '/insights/advisor');

    const breadcrumbs = [
      { pathname: '/insights/advisor/systems', title: 'Systems' },
      { pathname: '/insights/advisor/systems/123', title: 'System 123' },
    ];

    renderHook(() => useReplaceBreadcrumbs(breadcrumbs));

    const warnCalls = (console.warn as jest.Mock).mock.calls.filter((call) => call[0].includes('does not start with app mount pathname'));
    expect(warnCalls).toHaveLength(0);

    process.env.NODE_ENV = originalEnv;
  });
});
