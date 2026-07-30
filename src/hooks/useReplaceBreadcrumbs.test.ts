import { renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { appBreadcrumbOverrideAtom, breadcrumbReplaceModeAtom } from '../state/atoms/breadcrumbAtom';
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
});
