import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import axios from 'axios';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

import useAppFilter, { requiredBundles } from './useAppFilter';
import { navigationAtom } from '../../state/atoms/navigationAtom';
import { chromeModulesAtom } from '../../state/atoms/chromeModuleAtom';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { navItems: [] } })),
  },
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
  const defaultAtomValues = [
    [navigationAtom, {}],
    [chromeModulesAtom, {}],
  ];

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

  test('should create 7 API calls on the first dropdown open', async () => {
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => {
      return 666;
    });
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
    expect(axiosGetSpy).toHaveBeenCalledTimes(8);
    for (let index = 0; index < 7; index++) {
      expect(axiosGetSpy.mock.calls[index]).toEqual([`/api/chrome-service/v1/static/stable/stage/navigation/${requiredBundles[index]}-navigation.json?ts=666`]);
    }
    axiosGetSpy.mockReset();
    dateSpy.mockRestore();
  });

  test('should flatten group navigation', async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            id: TEST_ID,
            title: TEST_TITLE,
            navItems: [
              {
                groupId: 'foo',
                navItems: [
                  {
                    title: 'title',
                    href: '/foo/bar',
                    appId: 'foo',
                  },
                ],
              },
            ],
          },
        })
      )
      .mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
    expect(result.current.data[TEST_ID].links).toEqual([
      {
        appId: 'foo',
        href: '/foo/bar',
        isHidden: false,
        title: 'title',
      },
    ]);
    axiosGetSpy.mockReset();
  });

  test('should create navigation from shallow item', async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            id: TEST_ID,
            title: TEST_TITLE,
            navItems: [
              {
                title: 'title',
                href: '/foo/bar',
                appId: 'foo',
              },
            ],
          },
        })
      )
      .mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
    expect(result.current.data[TEST_ID].links).toEqual([
      {
        appId: 'foo',
        href: '/foo/bar',
        isHidden: false,
        title: 'title',
      },
    ]);
    axiosGetSpy.mockReset();
  });

  test('should preserver external links', async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            id: TEST_ID,
            title: TEST_TITLE,
            navItems: [
              {
                isExternal: true,
                title: 'title',
                href: 'https://foo/bar/baz/quaxx?query=param',
                appId: 'foo',
              },
            ],
          },
        })
      )
      .mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
    expect(result.current.data[TEST_ID].links).toEqual([
      {
        appId: 'foo',
        isExternal: true,
        href: 'https://foo/bar/baz/quaxx?query=param',
        isHidden: false,
        title: 'title',
      },
    ]);
    axiosGetSpy.mockReset();
  });

  test('should create top level link for expandable items', async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            id: TEST_ID,
            title: TEST_TITLE,
            navItems: [
              {
                title: 'title',
                expandable: true,
                routes: [
                  {
                    href: '/foo/bar/baz/quaxx',
                    appId: 'foo',
                    title: 'Nested',
                  },
                ],
              },
            ],
          },
        })
      )
      .mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
    expect(result.current.data[TEST_ID].links).toEqual([
      {
        appId: 'foo',
        href: '/foo/bar',
        isHidden: false,
        title: 'title',
      },
    ]);
  });

  test('should extract cost and subscriptions links', async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            id: TEST_ID,
            title: TEST_TITLE,
            navItems: [
              {
                title: 'title',
                expandable: true,
                routes: [
                  {
                    href: '/openshift/cost-management/foo',
                    appId: 'foo',
                    title: 'cost-nested',
                  },
                  {
                    href: '/openshift/subscriptions/foo',
                    appId: 'foo',
                    title: 'subs-nested-ins',
                  },
                  {
                    href: '/insights/subscriptions/foo',
                    appId: 'foo',
                    title: 'subs-nested-o',
                  },
                ],
              },
            ],
          },
        })
      )
      .mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
        links: [
          {
            appId: 'foo',
            href: '/openshift/cost-management/foo',
            isFedramp: false,
            title: 'cost-nested',
          },
        ],
      },
      {
        id: 'subscriptions',
        links: [
          {
            appId: 'foo',
            href: '/openshift/subscriptions/foo',
            title: 'subs-nested-ins',
          },
          {
            appId: 'foo',
            href: '/insights/subscriptions/foo',
            title: 'subs-nested-o',
          },
        ],
        title: 'Subscriptions',
      },
    ]);
  });

  test('should prevent duplicate links in cost/subs group', async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    const responseObject = {
      data: {
        id: TEST_ID,
        title: TEST_TITLE,
        navItems: [
          {
            title: 'title',
            expandable: true,
            routes: [
              {
                href: '/openshift/cost-management/foo',
                appId: 'foo',
                title: 'cost-nested',
              },
            ],
          },
        ],
      },
    };
    axiosGetSpy
      .mockImplementationOnce(() => Promise.resolve(responseObject))
      .mockImplementationOnce(() => Promise.resolve(responseObject))
      .mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
        links: [
          {
            appId: 'foo',
            href: '/openshift/cost-management/foo',
            title: 'cost-nested',
            isFedramp: false,
          },
        ],
      },
    ]);
  });

  test('should filter items', async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy
      .mockImplementationOnce(() =>
        Promise.resolve({
          data: {
            id: 'rhel',
            title: 'insights',
            navItems: [
              {
                title: 'title',
                href: '/foo/bar',
                appId: 'foo',
              },
            ],
          },
        })
      )
      .mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
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
    const expectAllItems = [
      {
        id: 'rhel',
        title: 'insights',
        links: [
          {
            appId: 'foo',
            href: '/foo/bar',
            isHidden: false,
            title: 'title',
          },
        ],
      },
    ];

    expect(result.current.filteredApps).toEqual(expectAllItems);
    await act(async () => {
      result.current.setFilterValue('nonsense');
    });
    expect(result.current.filteredApps).toEqual([]);
    await act(async () => {
      result.current.setFilterValue('itl');
    });
    expect(result.current.filteredApps).toEqual(expectAllItems);
    axiosGetSpy.mockReset();
  });
});
