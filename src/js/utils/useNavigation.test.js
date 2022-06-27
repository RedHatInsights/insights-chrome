import React, { useEffect } from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { MemoryRouter, Route, useHistory } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

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

import * as axios from 'axios';
import FlagProvider, { UnleashClient } from '@unleash/proxy-client-react';

jest.mock('@unleash/proxy-client-react', () => {
  const actual = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...actual,
    // unblock navigation loading
    useFlagsStatus: () => ({ flagsReady: true }),
  };
});

// eslint-disable-next-line react/prop-types
const RouteDummy = ({ path, children }) => {
  const { push } = useHistory();
  useEffect(() => {
    push(path);
  }, [path]);
  return (
    <Route exact path={path}>
      {children}
    </Route>
  );
};

const testClient = new UnleashClient({
  url: 'localhost:5000',
  clientKey: 'foo',
  appName: 'bar',
  boostrap: [{}],
  environment: 'dev',
});

// eslint-disable-next-line react/prop-types
const RouterDummy = ({ store, children, path }) => (
  <MemoryRouter>
    <FlagProvider unleashClient={testClient} startClient={false}>
      <Provider store={store}>
        <RouteDummy path={path}>{children}</RouteDummy>
      </Provider>
    </FlagProvider>
  </MemoryRouter>
);

describe('useNavigatiom', () => {
  const mockStore = configureStore();

  test('should update on namespace change', async () => {
    const axiosGetSpy = jest.spyOn(axios.default, 'get');
    const store = mockStore({
      chrome: {
        navigation: {
          insights: {
            id: 'insights',
            navItems: [],
          },
          ansible: {
            id: 'ansible',
            navItems: [],
          },
        },
      },
    });
    axiosGetSpy.mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
    const wrapper = ({ children, path }) => (
      <RouterDummy store={store} path={path}>
        {children}
      </RouterDummy>
    );

    const { result, rerender } = renderHook(() => useNavigation(), {
      wrapper,
      initialProps: {
        path: '/insights',
      },
    });
    expect(result.current).toEqual({
      loaded: true,
      schema: {
        id: 'insights',
        navItems: [],
      },
    });

    rerender({ path: '/ansible' });
    expect(result.current).toEqual({
      loaded: true,
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
      const navItem = {
        href: '/foo',
        title: 'bar',
        isHidden: true,
      };
      const store = mockStore({
        chrome: {
          navigation: {
            insights: {
              id: 'insights',
              navItems: [navItem],
            },
          },
        },
      });
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children, path }) => (
        <RouterDummy store={store} path={path}>
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
          initialProps: {
            path: '/insights',
          },
        });
      });

      expect(store.getActions()).toEqual([
        {
          type: '@@chrome/load-navigation-segment',
          payload: {
            segment: 'insights',
            pathName: '/insights',
            schema: {
              navItems: [
                expect.objectContaining({
                  isHidden: true,
                }),
              ],
            },
          },
        },
      ]);
    });

    test('should mark navigation item as hidden', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const navItem = {
        href: '/foo',
        title: 'bar',
        permissions: [
          {
            method: 'isOrgAdmin',
          },
        ],
      };
      const store = mockStore({
        chrome: {
          navigation: {
            insights: {
              id: 'insights',
              navItems: [navItem],
            },
          },
        },
      });
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children, path }) => (
        <RouterDummy store={store} path={path}>
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
          initialProps: {
            path: '/insights',
          },
        });
      });

      expect(store.getActions()).toEqual([
        {
          type: '@@chrome/load-navigation-segment',
          payload: {
            segment: 'insights',
            pathName: '/insights',
            schema: {
              navItems: [
                expect.objectContaining({
                  isHidden: true,
                }),
              ],
            },
          },
        },
      ]);
    });

    test('should mark navigation group items as hidden', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const navItem = {
        groupId: 'foo',
        title: 'bar',
        navItems: [
          {
            href: '/bar',
            permissions: [
              {
                method: 'isOrgAdmin',
              },
            ],
          },
        ],
      };
      const store = mockStore({
        chrome: {
          navigation: {
            insights: {
              id: 'insights',
              navItems: [navItem],
            },
          },
        },
      });
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children, path }) => (
        <RouterDummy store={store} path={path}>
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
          initialProps: {
            path: '/insights',
          },
        });
      });

      expect(store.getActions()).toEqual([
        {
          type: '@@chrome/load-navigation-segment',
          payload: {
            segment: 'insights',
            pathName: '/insights',
            schema: {
              navItems: [
                expect.objectContaining({
                  groupId: 'foo',
                  navItems: [
                    expect.objectContaining({
                      href: '/bar',
                      isHidden: true,
                    }),
                  ],
                }),
              ],
            },
          },
        },
      ]);
    });

    test('should mark expandable item routes as hidden', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const navItem = {
        title: 'bar',
        expandable: true,
        routes: [
          {
            href: '/bar',
            permissions: [
              {
                method: 'isOrgAdmin',
              },
            ],
          },
        ],
      };
      const store = mockStore({
        chrome: {
          navigation: {
            insights: {
              id: 'insights',
              navItems: [navItem],
            },
          },
        },
      });
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children, path }) => (
        <RouterDummy store={store} path={path}>
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
          initialProps: {
            path: '/insights',
          },
        });
      });

      expect(store.getActions()).toEqual([
        {
          type: '@@chrome/load-navigation-segment',
          payload: {
            segment: 'insights',
            pathName: '/insights',
            schema: {
              navItems: [
                expect.objectContaining({
                  expandable: true,
                  routes: [
                    expect.objectContaining({
                      href: '/bar',
                      isHidden: true,
                    }),
                  ],
                }),
              ],
            },
          },
        },
      ]);
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
      const store = mockStore({
        chrome: {
          navigation: {
            insights: {
              id: 'insights',
              navItems: [navItem],
            },
          },
        },
      });
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children, path }) => (
        <RouterDummy store={store} path={path}>
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
          initialProps: {
            path: '/insights',
          },
        });
      });

      expect(store.getActions()).toEqual([
        {
          type: '@@chrome/load-navigation-segment',
          payload: {
            segment: 'insights',
            pathName: '/insights',
            schema: {
              navItems: expect.any(Array),
            },
          },
        },
      ]);
    });
  });

  describe('activate child', () => {
    test('should mark /insights basic nav item as active', async () => {
      const axiosGetSpy = jest.spyOn(axios.default, 'get');
      const navItem = {
        title: 'bar',
        href: '/insights',
      };
      const store = mockStore({
        chrome: {
          navigation: {
            insights: {
              id: 'insights',
              navItems: [navItem],
            },
          },
        },
      });
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children, path }) => (
        <RouterDummy store={store} path={path}>
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
          initialProps: {
            path: '/insights',
          },
        });
      });

      expect(store.getActions()).toEqual([
        {
          type: '@@chrome/load-navigation-segment',
          payload: {
            segment: 'insights',
            pathName: '/insights',
            schema: {
              navItems: [
                {
                  href: '/insights',
                  isHidden: false,
                  title: 'bar',
                },
              ],
            },
          },
        },
      ]);
    });

    test('should mark nested /insights/dashboard nav item as its parent as active', async () => {
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
      const store = mockStore({
        chrome: {
          navigation: {
            insights: {
              id: 'insights',
              navItems: [navItem],
            },
          },
        },
      });
      axiosGetSpy.mockImplementation(() =>
        Promise.resolve({
          data: {
            navItems: [navItem],
          },
        })
      );
      const wrapper = ({ children, path }) => (
        <RouterDummy store={store} path={path}>
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
          initialProps: {
            path: '/insights/dashboard',
          },
        });
      });

      expect(store.getActions()).toEqual([
        {
          type: '@@chrome/load-navigation-segment',
          payload: {
            segment: 'insights',
            pathName: '/insights/dashboard',
            schema: {
              navItems: [
                {
                  expandable: true,
                  isHidden: false,
                  title: 'bar',
                  routes: [
                    {
                      href: '/insights/dashboard',
                      isHidden: false,
                    },
                  ],
                },
              ],
            },
          },
        },
      ]);
    });
  });
});
