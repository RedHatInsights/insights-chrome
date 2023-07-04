/* eslint-disable react/display-name */
import React, { Fragment, useEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
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

describe('useNavigation', () => {
  const mockStore = configureStore();
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
    const createWrapper = (props) => {
      function Wrapper({ children }) {
        return (
          <RouterDummy store={store} {...props}>
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
      const wrapper = ({ children }) => (
        <RouterDummy store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
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
      const wrapper = ({ children }) => (
        <RouterDummy store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
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
      const wrapper = ({ children }) => (
        <RouterDummy store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
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
      const wrapper = ({ children }) => (
        <RouterDummy store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
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
      const wrapper = ({ children }) => (
        <RouterDummy store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
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
      const wrapper = ({ children }) => (
        <RouterDummy store={store} path="/insights">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
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
      const wrapper = ({ children }) => (
        <RouterDummy store={store} path="/insights/dashboard">
          {children}
        </RouterDummy>
      );

      await act(async () => {
        await renderHook(() => useNavigation(), {
          wrapper,
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
