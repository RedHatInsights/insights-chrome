import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

import AppFilter from '../AppFilter';

jest.mock('../../../nav/sourceOfTruth', () => {
  const source = jest.requireActual('../../../nav/sourceOfTruth');
  return {
    __esModule: true,
    ...source,
    default: jest.fn().mockResolvedValue({}),
  };
});
jest.mock('../../../nav/globalNav', () => {
  const source = jest.requireActual('../../../nav/globalNav');
  const appData = ['insights', 'openshift', 'cost-management', 'migrations', 'subscriptions', 'ansible', 'settings'].reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: {
        id: curr,
        title: curr,
        routes: [{ id: curr, title: curr }],
      },
    }),
    {}
  );
  return {
    __esModule: true,
    ...source,
    getNavFromConfig: jest.fn().mockImplementation(() => Promise.resolve(appData)),
  };
});

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
    expect(container.querySelectorAll('.content')).toHaveLength(1);
  });

  test('should set and clear filter input value', async () => {
    const { container } = render(<AppFilter />);
    const button = container.querySelector('#toggle-id');
    await act(async () => {
      fireEvent.click(button);
    });
    const input = container.querySelector('input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'foo' } });
    });
    expect(input.value).toEqual('foo');
    const clearButton = container.querySelector('[data-ouia-component-id=app-filter-search] button');
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
    const input = container.querySelector('input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'foo' } });
    });
    expect(container).toMatchSnapshot();
    const clearButton = container.querySelector('[data-ouia-component-id=app-filter-clear-input]');
    expect(clearButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(clearButton);
    });
    expect(input.value).toEqual('');
  });
});
