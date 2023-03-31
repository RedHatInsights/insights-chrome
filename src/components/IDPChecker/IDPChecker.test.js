import React from 'react';
import axios from 'axios';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import configureStore from 'redux-mock-store';
import * as utils from '../../utils/common';
import IDPChecker from './IDPChecker';

jest.mock('../../utils/common', () => {
  const utils = jest.requireActual('../../utils/common');
  return {
    __esModule: true,
    ...utils,
    ITLess: jest.fn(),
  };
});

jest.mock('axios', () => {
  const axios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...axios,
    get: jest.fn(),
  };
});

describe('<IDPChecker />', () => {
  const ITLessSpy = jest.spyOn(utils, 'ITLess');
  const getSpy = jest.spyOn(axios, 'get');
  let mockStore;
  const initialState = {
    chrome: {
      user: {
        foo: 'bar',
      },
      missingIDP: false,
    },
  };

  beforeEach(() => {
    mockStore = configureStore();
    ITLessSpy.mockReturnValue(true);
    getSpy.mockImplementation(() => Promise.resolve({}));
  });

  test('should render children in non fedRamp env', () => {
    ITLessSpy.mockReturnValueOnce(false);
    const store = mockStore(initialState);
    const { container, queryAllByTestId } = render(
      <Provider store={store}>
        <IDPChecker>
          <span data-testid="foo">OK</span>
        </IDPChecker>
      </Provider>
    );

    expect(queryAllByTestId('foo')).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  test('should render error state if IDP is missing in fedramp env', async () => {
    const store = mockStore({
      ...initialState,
      chrome: {
        missingIDP: true,
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <IDPChecker>
            <span data-testid="foo">OK</span>
          </IDPChecker>
        </Provider>
      );
    });

    expect(screen.queryAllByTestId('foo')).toHaveLength(0);
    expect(screen.getAllByText('Authorization failure')).toHaveLength(1);
  });

  test('should render error state if IDP test API returns 403', async () => {
    getSpy.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 403,
        },
        message: 'Insights authorization failed - account number not in allow list',
      })
    );
    const store = mockStore(initialState);

    await act(async () => {
      render(
        <Provider store={store}>
          <IDPChecker>
            <span data-testid="foo">OK</span>
          </IDPChecker>
        </Provider>
      );
    });

    expect(screen.queryAllByTestId('foo')).toHaveLength(0);
    expect(screen.getAllByText('Authorization failure')).toHaveLength(1);
  });

  test('should render children if IDP validation passes', async () => {
    const store = mockStore(initialState);

    await act(async () => {
      render(
        <Provider store={store}>
          <IDPChecker>
            <span data-testid="foo">OK</span>
          </IDPChecker>
        </Provider>
      );
    });

    expect(screen.queryAllByTestId('foo')).toHaveLength(1);
  });
});
