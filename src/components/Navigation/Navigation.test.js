/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act, render } from '@testing-library/react';
import createMockStore from 'redux-mock-store';
import Navigation from './';

jest.mock('@unleash/proxy-client-react', () => {
  const actual = jest.requireActual('@unleash/proxy-client-react');
  return {
    __esModule: true,
    ...actual,
    // unblock navigation loading
    useFlagsStatus: () => ({ flagsReady: true }),
  };
});

const NavContextWrapper = ({ store, children, initialEntries = ['/insights/dashboard'] }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

describe('ChromeNavItem', () => {
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
    expect(container.querySelectorAll('.chr-c-app-switcher--loading')).toHaveLength(1);
    expect(container.querySelectorAll('.chr-c-app-title')).toHaveLength(0);
  });

  test('should render navigation ', async () => {
    let container;
    await act(async () => {
      const { container: iContainer } = render(
        <NavContextWrapper store={store}>
          <Navigation loaded schema={{ navItems: [], title: navTitle }} />
        </NavContextWrapper>
      );
      container = iContainer;
    });
    expect(container).toMatchSnapshot();
    expect(container.querySelectorAll('.chr-c-app-switcher--loading')).toHaveLength(0);
    expect(container.querySelectorAll('.chr-c-app-title')).toHaveLength(1);
    expect(container.querySelector('.chr-c-app-title').textContent).toEqual(navTitle);
  });
});
