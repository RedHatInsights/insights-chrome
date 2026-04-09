import React from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import useBreadcrumbsLinks from './useBreadcrumbsLinks';
import { moduleRoutesAtom } from '../state/atoms/chromeModuleAtom';
import { navigationAtom } from '../state/atoms/navigationAtom';
import { Navigation, RouteDefinition } from '../@types/types';

jest.mock('./useBundle', () => ({
  __esModule: true,
  default: () => ({ bundleId: 'insights', bundleTitle: 'RHEL' }),
  getUrl: () => 'insights',
}));

describe('useBreadcrumbsLinks', () => {
  const createWrapper = (pathname: string, routes: RouteDefinition[] = [], navigation: { [key: string]: Navigation } = {}) => {
    const store = createStore();
    store.set(moduleRoutesAtom, routes);
    store.set(navigationAtom, navigation);

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={[pathname]}>
        <Provider store={store}>{children}</Provider>
      </MemoryRouter>
    );
    return Wrapper;
  };

  it('should return bundle segment when no active navigation is present', () => {
    const wrapper = createWrapper('/insights/dashboard');
    const { result } = renderHook(() => useBreadcrumbsLinks(), { wrapper });

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      title: 'RHEL',
      href: '/insights',
    });
  });

  it('should not throw when matchRoutes returns no match for active item', () => {
    // This tests the fix for RHCLOUD-37896:
    // TypeError: Cannot read properties of undefined (reading 'join')
    // When fallbackMatchFragments is undefined because matchRoutes returns no match.
    const navigation: { [key: string]: Navigation } = {
      insights: {
        sortedLinks: [],
        navItems: [
          {
            groupId: 'operations',
            title: 'Operations',
            navItems: [
              {
                title: 'Advisor',
                href: '/insights/advisor',
                active: true,
              },
            ],
          },
        ],
      },
    };

    // No routes provided — matchRoutes will return null/empty, triggering the bug path
    const wrapper = createWrapper('/insights/advisor', [], navigation);

    // Before the fix, this would throw:
    // TypeError: Cannot read properties of undefined (reading 'join')
    expect(() => {
      renderHook(() => useBreadcrumbsLinks(), { wrapper });
    }).not.toThrow();
  });

  it('should fall back to bundle href when no route match fragments exist', () => {
    const navigation: { [key: string]: Navigation } = {
      insights: {
        sortedLinks: [],
        navItems: [
          {
            groupId: 'operations',
            title: 'Operations',
            navItems: [
              {
                title: 'Advisor',
                href: '/insights/advisor',
                active: true,
              },
            ],
          },
        ],
      },
    };

    // No routes — fallbackMatchFragments will be empty, should fall back to bundleId href
    const wrapper = createWrapper('/insights/advisor', [], navigation);
    const { result } = renderHook(() => useBreadcrumbsLinks(), { wrapper });

    // First segment is the bundle
    expect(result.current[0]).toEqual({
      title: 'RHEL',
      href: '/insights',
    });

    // With no routes, only bundle and active item segments are generated
    // (group segments like "Operations" are not included in breadcrumbs)
    expect(result.current.length).toBeGreaterThanOrEqual(1);
    expect(result.current.some((s) => s.title === 'Advisor')).toBe(true);
  });

  it('should generate correct breadcrumb segments with valid route match', () => {
    const navigation: { [key: string]: Navigation } = {
      insights: {
        sortedLinks: [],
        navItems: [
          {
            groupId: 'operations',
            title: 'Operations',
            navItems: [
              {
                title: 'Advisor',
                href: '/insights/advisor',
                active: true,
              },
            ],
          },
        ],
      },
    };

    const routes: RouteDefinition[] = [
      {
        path: '/insights/advisor',
        scope: 'insights',
        module: 'advisor',
        manifestLocation: '/apps/advisor/manifest.json',
      },
    ];
    const wrapper = createWrapper('/insights/advisor', routes, navigation);
    const { result } = renderHook(() => useBreadcrumbsLinks(), { wrapper });

    // Should have bundle + active item = 2 segments
    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toEqual({
      title: 'RHEL',
      href: '/insights',
    });
    expect(result.current[1]).toEqual({
      title: 'Advisor',
      href: '/insights/advisor',
      active: true,
    });
  });
});
