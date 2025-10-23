import React, { Fragment, useEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import useNavigation from './useNavigation';

jest.mock('axios', () => {
  const axios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...axios,
    default: {
      ...axios.default,
      get: () => Promise.resolve({ data: {} }),
    },
  };
});

jest.mock('@scalprum/core', () => {
  return {
    __esModule: true,
    initSharedScope: jest.fn(),
    getSharedScope: jest.fn().mockReturnValue({}),
  };
});

import * as axios from 'axios';
import FlagProvider, { UnleashClient } from '@unleash/proxy-client-react';
import { initializeVisibilityFunctions } from './VisibilitySingleton';
import { navigationAtom } from '../state/atoms/navigationAtom';

jest.mock('@unleash/proxy-client-react', () => {
  const actual = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...actual,
    // unblock navigation loading
    useFlagsStatus: () => ({ flagsReady: true }),
  };
});

const RouteDummy = ({ path, children }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(path);
  }, [path]);
  return (
    <Routes>
      <Route path={path} element={<Fragment>{children}</Fragment>} />
    </Routes>
  );
};

const testClient = new UnleashClient({
  url: 'localhost:5000',
  clientKey: 'foo',
  appName: 'bar',
  boostrap: [{}],
  environment: 'dev',
  fetch: () => ({}),
});

const HydrateAtoms = ({ initialValues, children }) => {
  useHydrateAtoms(initialValues);
  return children;
};

const TestProvider = ({ initialValues, children, store }) => {
  useEffect(() => {
    if (store) {
      initialValues.forEach(([atom, value]) => {
        store.set(atom, value);
      });
    }
  }, []);
  return (
    <JotaiProvider store={store}>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </JotaiProvider>
  );
};

const RouterDummy = ({ children, path, initialValues, store }) => (
  <MemoryRouter>
    <FlagProvider unleashClient={testClient} startClient={false}>
      <TestProvider initialValues={initialValues} store={store}>
        <RouteDummy path={path}>{children}</RouteDummy>
      </TestProvider>
    </FlagProvider>
  </MemoryRouter>
);

describe('useNavigation', () => {
  beforeAll(() => {
    initializeVisibilityFunctions({
      getUser() {
        return Promise.resolve({});
      },
      getToken: () => Promise.resolve('a.a'),
      getUserPermissions: () => Promise.resolve([]),
    });
  });

  test('should update on namespace change', async () => {
    const axiosGetSpy = jest.spyOn(axios.default, 'get');
    const navigation = {
      insights: {
        id: 'insights',
        navItems: [],
      },
      ansible: {
        id: 'ansible',
        navItems: [],
      },
    };
    axiosGetSpy.mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
    const createWrapper = (props) => {
      function Wrapper({ children }) {
        return (
          <RouterDummy initialValues={[[navigationAtom, navigation]]} {...props}>
            {children}
          </RouterDummy>
        );
      }
      return Wrapper;
    };

    const { result: inResult } = renderHook(() => useNavigation(), {
      wrapper: createWrapper({ path: '/insights' }),
    });
    expect(inResult.current).toEqual({
      loaded: true,
      noNav: false,
      schema: {
        id: 'insights',
        navItems: [],
      },
    });

    const { result: anResult } = renderHook(() => useNavigation(), {
      wrapper: createWrapper({ path: '/ansible' }),
    });
    expect(anResult.current).toEqual({
      loaded: true,
      noNav: false,
      schema: {
        id: 'ansible',
        navItems: [],
      },
    });

    axiosGetSpy.mockReset();
  });

  describe('isHidden flag', () => {
    test('should propagate navigation item isHidden flag', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const store = createStore();
      const navItem = {
        href: '/foo',
        title: 'bar',
        isHidden: true,
      };
      const navigation = {
        insights: {
          id: 'insights',
          navItems: [navItem],
        },
      };
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children }) => (
        <RouterDummy store={store} initialValues={[[navigationAtom, navigation]]} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
        });
      });

      const data = store.get(navigationAtom);

      expect(data).toEqual({
        insights: {
          id: 'insights',
          navItems: [
            expect.objectContaining({
              isHidden: true,
            }),
          ],
          sortedLinks: ['/foo'],
        },
      });
    });
  });

  describe('levelArray', () => {
    test('should flatten and sort links based on the href length', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const navItem = {
        groupId: 'foo',
        title: 'bar',
        navItems: [
          {
            href: '/bar',
          },
          {
            href: '/foo/bar',
          },
          {
            expandable: true,
            routes: [
              {
                href: '/baz',
              },
              {
                href: '/baz/bar/quaxx',
              },
              {
                href: '/baz/bar',
              },
              {
                invalid: 'item',
              },
            ],
          },
        ],
      };
      const navigation = {
        insights: {
          id: 'insights',
          navItems: [navItem],
        },
      };
      const store = createStore();
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children }) => (
        <RouterDummy initialValues={[[navigationAtom, navigation]]} store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
        });
      });

      const data = store.get(navigationAtom);
      expect(data).toEqual({
        insights: {
          id: 'insights',
          navItems: expect.any(Array),
          sortedLinks: ['/baz/bar/quaxx', '/baz/bar', '/foo/bar', '/baz', '/bar'],
        },
      });
    });
  });

  describe('activate child', () => {
    test('should mark /insights basic nav item as active', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const navItem = {
        title: 'bar',
        href: '/insights',
      };
      const navigation = {
        insights: {
          id: 'insights',
          navItems: [navItem],
        },
      };
      const store = createStore();
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children }) => (
        <RouterDummy initialValues={[[navigationAtom, navigation]]} store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
        });
      });

      const data = store.get(navigationAtom);

      expect(data).toEqual({
        insights: {
          id: 'insights',
          navItems: [{ title: 'bar', href: '/insights', active: true }],
          sortedLinks: ['/insights'],
        },
      });
    });

    test.only('should mark nested /insights/dashboard nav item as its parent as active', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const navItem = {
        expandable: true,
        title: 'bar',
        routes: [
          {
            href: '/insights/dashboard',
          },
        ],
      };
      const navigation = {
        insights: {
          id: 'insights',
          navItems: [navItem],
        },
      };
      const store = createStore();
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children }) => (
        <RouterDummy initialValues={[[navigationAtom, navigation]]} store={store} path="/insights/dashboard">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
        });
      });

      const data = store.get(navigationAtom);

      expect(data).toEqual({
        insights: {
          id: 'insights',
          navItems: [
            {
              expandable: true,
              title: 'bar',
              routes: [
                {
                  href: '/insights/dashboard',
                  active: true,
                },
              ],
              active: true,
            },
          ],
          sortedLinks: ['/insights/dashboard'],
        },
      });
    });
  });
});
