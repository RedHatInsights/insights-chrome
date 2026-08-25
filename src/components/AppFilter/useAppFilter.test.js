import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import useAppFilter from './useAppFilter';
import { chromeModulesAtom } from '../../state/atoms/chromeModuleAtom';

const mockVisibleBundles = jest.fn().mockReturnValue([]);
jest.mock('../../state/atoms/visibleBundlesAtom', () => ({
  useVisibleBundles: () => mockVisibleBundles(),
}));

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const ContextWrapper = ({ children, atomValues = [] }) => (
  <MemoryRouter>
    <JotaiProvider>
      <HydrateAtoms initialValues={atomValues}>
        <div>{children}</div>
      </HydrateAtoms>
    </JotaiProvider>
  </MemoryRouter>
);

const TEST_ID = 'foo-id';
const TEST_TITLE = 'foo-title';

describe('useAppFilter', () => {
  const defaultAtomValues = [[chromeModulesAtom, {}]];

  afterEach(() => {
    mockVisibleBundles.mockReturnValue([]);
  });

  test('should not create any API calls if the filter is not opened', async () => {
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });

    const expectedState = {
      isLoaded: false,
      isLoading: false,
      isOpen: false,
      filterValue: '',
      setIsOpen: expect.any(Function),
      setFilterValue: expect.any(Function),
      filteredApps: [],
      data: {
        'cost-management': {
          id: 'cost-management',
          title: 'Cost Management',
          links: [],
        },
        subscriptions: {
          id: 'subscriptions',
          title: 'Subscriptions',
          links: [],
        },
      },
    };
    expect(result.current).toEqual(expectedState);
  });

  test('should process visible bundles on the first dropdown open', async () => {
    mockVisibleBundles.mockReturnValue([
      { id: 'openshift', title: 'OpenShift', navItems: [{ title: 'Clusters', href: '/openshift/clusters', appId: 'openshift' }] },
    ]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    expect(result.current.data['openshift'].links).toEqual([expect.objectContaining({ title: 'Clusters', href: '/openshift/clusters' })]);
  });

  test('should flatten group navigation', async () => {
    mockVisibleBundles.mockReturnValue([
      {
        id: TEST_ID,
        title: TEST_TITLE,
        navItems: [{ groupId: 'foo', navItems: [{ title: 'title', href: '/foo/bar', appId: 'foo' }] }],
      },
    ]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    expect(result.current.data[TEST_ID].links).toEqual([{ appId: 'foo', href: '/foo/bar', title: 'title' }]);
  });

  test('should create navigation from shallow item', async () => {
    mockVisibleBundles.mockReturnValue([{ id: TEST_ID, title: TEST_TITLE, navItems: [{ title: 'title', href: '/foo/bar', appId: 'foo' }] }]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    expect(result.current.data[TEST_ID].links).toEqual([{ appId: 'foo', href: '/foo/bar', title: 'title' }]);
  });

  test('should preserver external links', async () => {
    mockVisibleBundles.mockReturnValue([
      { id: TEST_ID, title: TEST_TITLE, navItems: [{ isExternal: true, title: 'title', href: 'https://foo/bar/baz/quaxx?query=param', appId: 'foo' }] },
    ]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    expect(result.current.data[TEST_ID].links).toEqual([{ appId: 'foo', isExternal: true, href: 'https://foo/bar/baz/quaxx?query=param', title: 'title' }]);
  });

  test('should create top level link for expandable items', async () => {
    mockVisibleBundles.mockReturnValue([
      {
        id: TEST_ID,
        title: TEST_TITLE,
        navItems: [{ title: 'title', expandable: true, navItems: [{ href: '/foo/bar/baz/quaxx', appId: 'foo', title: 'Nested' }] }],
      },
    ]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    expect(result.current.data[TEST_ID].links).toEqual([{ appId: 'foo', href: '/foo/bar', title: 'title' }]);
  });

  test('should extract cost and subscriptions links', async () => {
    mockVisibleBundles.mockReturnValue([
      {
        id: TEST_ID,
        title: TEST_TITLE,
        navItems: [
          {
            title: 'title',
            expandable: true,
            navItems: [
              { href: '/openshift/cost-management/foo', appId: 'foo', title: 'cost-nested' },
              { href: '/openshift/subscriptions/foo', appId: 'foo', title: 'subs-nested-ins' },
              { href: '/insights/subscriptions/foo', appId: 'foo', title: 'subs-nested-o' },
            ],
          },
        ],
      },
    ]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    expect(result.current.filteredApps).toEqual([
      {
        id: 'cost-management',
        title: 'Cost Management',
        links: [{ appId: 'foo', href: '/openshift/cost-management/foo', isFedramp: false, title: 'cost-nested' }],
      },
      {
        id: 'subscriptions',
        title: 'Subscriptions',
        links: [
          { appId: 'foo', href: '/openshift/subscriptions/foo', title: 'subs-nested-ins' },
          { appId: 'foo', href: '/insights/subscriptions/foo', title: 'subs-nested-o' },
        ],
      },
    ]);
  });

  test('should prevent duplicate links in cost/subs group', async () => {
    mockVisibleBundles.mockReturnValue([
      {
        id: TEST_ID,
        title: TEST_TITLE,
        navItems: [{ title: 'title', expandable: true, navItems: [{ href: '/openshift/cost-management/foo', appId: 'foo', title: 'cost-nested' }] }],
      },
      {
        id: 'duplicate',
        title: 'Duplicate',
        navItems: [{ title: 'title', expandable: true, navItems: [{ href: '/openshift/cost-management/foo', appId: 'foo', title: 'cost-nested' }] }],
      },
    ]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    expect(result.current.filteredApps).toEqual([
      {
        id: 'cost-management',
        title: 'Cost Management',
        links: [{ appId: 'foo', href: '/openshift/cost-management/foo', title: 'cost-nested', isFedramp: false }],
      },
    ]);
  });

  test('should filter items', async () => {
    mockVisibleBundles.mockReturnValue([{ id: 'rhel', title: 'insights', navItems: [{ title: 'title', href: '/foo/bar', appId: 'foo' }] }]);
    let result;
    await act(async () => {
      const { result: r } = renderHook(() => useAppFilter(), {
        wrapper: (props) => <ContextWrapper {...props} atomValues={defaultAtomValues} />,
      });
      result = r;
    });
    await act(async () => {
      result.current.setIsOpen(true);
    });
    const expectAllItems = [{ id: 'rhel', title: 'insights', links: [{ appId: 'foo', href: '/foo/bar', title: 'title' }] }];

    expect(result.current.filteredApps).toEqual(expectAllItems);
    await act(async () => {
      result.current.setFilterValue('nonsense');
    });
    expect(result.current.filteredApps).toEqual([]);
    await act(async () => {
      result.current.setFilterValue('itl');
    });
    expect(result.current.filteredApps).toEqual(expectAllItems);
  });
});
