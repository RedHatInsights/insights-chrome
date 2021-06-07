/* eslint-disable react/prop-types */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

import useGlobalNav from './useGlobalNav';
jest.mock('../nav/sourceOfTruth', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));
import sourceOfTruth from '../nav/sourceOfTruth';
import { Fragment } from 'react';

const TEST_ID = 'global-nav-toggle';
const TEST_QUERYSELECTOR = `#${TEST_ID}`;

const DummyApp = ({ getHookData = () => undefined }) => {
  const data = useGlobalNav();
  const { setIsOpen, isOpen, setFilterValue, filterValue } = data;
  getHookData(data);
  return (
    <Fragment>
      <button onClick={() => setIsOpen(!isOpen)} id={TEST_ID}></button>
      <input onChange={({ target: { value } }) => setFilterValue(value)} value={filterValue} />
    </Fragment>
  );
};

describe('useGlobalNav', () => {
  afterEach(() => {
    sourceOfTruth.mockClear();
  });

  test('should not fetch main.yml before the nav is open', () => {
    const { container } = render(<DummyApp />);
    expect(container.querySelectorAll(TEST_QUERYSELECTOR)).toHaveLength(1);
    expect(sourceOfTruth).not.toHaveBeenCalled();
  });

  test('should fetch main.yml after the nav is open', async () => {
    const getHookData = jest.fn();
    const { container } = render(<DummyApp getHookData={getHookData} />);
    const button = container.querySelector(TEST_QUERYSELECTOR);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(sourceOfTruth).toHaveBeenCalledTimes(1);
    expect(getHookData).toHaveBeenLastCalledWith({
      apps: [],
      filterValue: '',
      filteredApps: expect.any(Array),
      isLoaded: true,
      isOpen: true,
      setFilterValue: expect.any(Function),
      setIsOpen: expect.any(Function),
    });
  });

  test('should set filter value', async () => {
    const getHookData = jest.fn();
    const { container } = render(<DummyApp getHookData={getHookData} />);
    const button = container.querySelector(TEST_QUERYSELECTOR);
    await act(async () => {
      fireEvent.click(button);
    });
    const input = container.querySelector('input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'foo' } });
    });
    expect(input.value).toBe('foo');
  });
});
