import { renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { appBreadcrumbStorageAtom } from '../state/atoms/breadcrumbAtom';
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
});
