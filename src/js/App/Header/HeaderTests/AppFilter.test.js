import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';

import AppFilter from '../AppFilter';

describe('<AppFilter />', () => {
  test('should render correctly', () => {
    const { container } = render(<AppFilter />);
    expect(container).toMatchSnapshot();
  });

  test('should open and fetch data', async () => {
    const { container } = render(<AppFilter />);
    const button = container.querySelector('#toggle-id');
    await act(async () => {
      fireEvent.click(button);
    });
    const menuContainer = screen.getByTestId('ins-c__find-app-service');
    expect(menuContainer.querySelectorAll('.content')).toHaveLength(1);
  });

  test('should set and clear filter input value', async () => {
    const { container } = render(<AppFilter />);
    const button = container.querySelector('#toggle-id');
    await act(async () => {
      fireEvent.click(button);
    });
    const menuContainer = screen.getByTestId('ins-c__find-app-service');
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
    const { container } = render(<AppFilter />);
    const button = container.querySelector('#toggle-id');
    await act(async () => {
      fireEvent.click(button);
    });
    const menuContainer = screen.getByTestId('ins-c__find-app-service');
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
