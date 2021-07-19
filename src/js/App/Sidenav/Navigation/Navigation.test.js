/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, act } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import Navigation from './';

jest.mock('axios', () => {
  const axios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...axios,
    get: () =>
      Promise.resolve({
        data: {
          navItems: [],
        },
      }),
    default: {
      ...axios.default,
      get: () =>
        Promise.resolve({
          data: {
            navItems: [],
          },
        }),
    },
  };
});

import * as axios from 'axios';

const NavContextWrapper = ({ store, children, initialEntries = ['/insights/dashboard'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

describe('ChromeNavItem', () => {
  const axiosGetSpy = jest.spyOn(axios.default, 'get');
  axiosGetSpy.mockImplementation(() => Promise.resolve({ data: { navItems: [] } }));
  const mockStore = createMockStore();
  const navTitle = 'Nav title';
  const store = mockStore({
    chrome: {
      activeModule: 'insights',
      modules: {
        insights: {},
      },
      navigation: {
        insights: {
          title: navTitle,
          navItems: [],
        },
      },
    },
  });

  test('should render navigation loader if schema was not loaded', () => {
    const store = mockStore({
      chrome: {
        activeModule: 'insights',
        modules: {
          insights: {},
        },
        navigation: {},
      },
    });
    const { container } = render(
      <NavContextWrapper store={store}>
        <Navigation />
      </NavContextWrapper>
    );
    expect(container).toMatchSnapshot();
    expect(container.querySelectorAll('.ins-c-app-switcher--loading')).toHaveLength(1);
    expect(container.querySelectorAll('.ins-c-app-title')).toHaveLength(0);
  });

  test('should render navigation ', async () => {
    let container;
    await act(async () => {
      const { container: iContainer } = render(
        <NavContextWrapper store={store}>
          <Navigation />
        </NavContextWrapper>
      );
      container = iContainer;
    });
    expect(container).toMatchSnapshot();
    expect(container.querySelectorAll('.ins-c-app-switcher--loading')).toHaveLength(0);
    expect(container.querySelectorAll('.ins-c-app-title')).toHaveLength(1);
    expect(container.querySelector('.ins-c-app-title').textContent).toEqual(navTitle);
  });
});
