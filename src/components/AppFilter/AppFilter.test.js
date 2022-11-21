/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import AppFilter from '../AppFilter';

jest.mock('axios', () => {
  const axios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...axios,
    default: {
      ...axios.default,
      get: () => Promise.resolve({ data: { navItems: [] } }),
    },
  };
});

const mockStore = configureStore();
const store = mockStore({
  chrome: {
    navigation: {},
  },
});

const ContextWrapper = ({ children }) => (
  <Provider store={store}>
    <MemoryRouter>{children}</MemoryRouter>
  </Provider>
);

describe('<AppFilter />', () => {
  test('should render correctly', () => {
    const { container } = render(<AppFilter />, {
      wrapper: ContextWrapper,
    });
    expect(container).toMatchSnapshot();
  });

  test('should open and fetch data', async () => {
    const { container } = render(<AppFilter />, {
      wrapper: ContextWrapper,
    });
    const button = container.querySelector('#toggle-id');
    await act(async () => {
      fireEvent.click(button);
    });
    const menuContainer = screen.getByTestId('chr-c__find-app-service');
    expect(menuContainer.querySelectorAll('.chr-app-filter-content')).toHaveLength(1);
  });

  test('should set and clear filter input value', async () => {
    const { container } = render(<AppFilter />, {
      wrapper: ContextWrapper,
    });
    const button = container.querySelector('#toggle-id');
    await act(async () => {
      fireEvent.click(button);
    });
    const menuContainer = screen.getByTestId('chr-c__find-app-service');
    const input = menuContainer.querySelector('input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'foo' } });
    });
    expect(input.value).toEqual('foo');
    const clearButton = menuContainer.querySelector('[data-ouia-component-id=app-filter-search] button');
    expect(clearButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(clearButton);
    });
    expect(input.value).toEqual('');
  });

  test('should render empty state on no filter match and clear app filters', async () => {
    const { container } = render(<AppFilter />, {
      wrapper: ContextWrapper,
    });
    const button = container.querySelector('#toggle-id');
    await act(async () => {
      fireEvent.click(button);
    });
    const menuContainer = screen.getByTestId('chr-c__find-app-service');
    const input = menuContainer.querySelector('input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'foo' } });
    });
    expect(container).toMatchSnapshot();
    const clearButton = menuContainer.querySelector('[data-ouia-component-id=app-filter-clear-input]');
    expect(clearButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(clearButton);
    });
    expect(input.value).toEqual('');
  });
});
