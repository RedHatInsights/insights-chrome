import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import * as axios from 'axios';

import useQuickstartsStates from './useQuickstartsStates';
import ChromeAuthContext from '../../auth/ChromeAuthContext';

jest.mock('axios', () => {
  const axios = jest.requireActual('axios');
  return {
    __esModule: true,
    ...axios,
    default: {
      ...axios.default,
      get: () => Promise.resolve({ data: [] }),
      post: () => Promise.resolve({ data: [] }),
    },
  };
});

jest.mock('../../utils/common', () => {
  return {
    __esModule: true,
    getEnv: jest.fn().mockReturnValue('stage'),
  };
});

const mockChromeContextValue = {
  user: {
    identity: {
      internal: {
        account_id: 666,
      },
    },
  },
  ready: true,
};

const emptyStore = createStore(() => ({}));
const WrapperComponent = ({ children, store = emptyStore, contextValue = mockChromeContextValue }) => (
  <ChromeAuthContext.Provider value={contextValue}>
    <Provider store={store}>{children}</Provider>
  </ChromeAuthContext.Provider>
);

describe('useQuickstartsStates stage', () => {
  const getSpy = jest.spyOn(axios.default, 'get');
  const postSpy = jest.spyOn(axios.default, 'post');

  afterEach(() => {
    getSpy.mockClear();
    postSpy.mockClear();
  });

  test('should not call API if no account Id exists', () => {
    const wrapper = ({ children }) => <WrapperComponent contextValue={{ ready: false, user: {} }}>{children}</WrapperComponent>;

    const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

    expect(getSpy).not.toHaveBeenCalled();
    expect(result.current.activeQuickStartID).toBe('');
  });

  test('should call quickstarts progress API if account id exists', async () => {
    getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [] } }));

    const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
    let result;
    await act(async () => {
      const { result: resultInternal } = renderHook(() => useQuickstartsStates('123'), { wrapper });
      result = resultInternal;
    });

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(result.current.activeQuickStartID).toBe('');
    expect(result.current.allQuickStartStates).toEqual({});
  });

  test('should call quickstarts progress API and parse the response', async () => {
    getSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          data: [
            {
              quickstartName: 'test-name',
              accountId: 123,
              progress: { foo: 'bar' },
            },
          ],
        },
      })
    );

    const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
    let result;
    await act(async () => {
      const { result: resultInternal } = renderHook(() => useQuickstartsStates('123'), { wrapper });
      result = resultInternal;
    });

    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(result.current.activeQuickStartID).toBe('');
    expect(result.current.allQuickStartStates).toEqual({
      'test-name': {
        foo: 'bar',
      },
    });
  });

  test('should set active quickstart id', () => {
    const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;

    const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

    act(() => {
      result.current.setActiveQuickStartID('test-id');
    });
    expect(result.current.activeQuickStartID).toBe('test-id');
  });

  test('should set quickstarts states from object', () => {
    const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;

    const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

    act(() => {
      result.current.setAllQuickStartStates({ foo: 'bar' });
    });
    expect(result.current.allQuickStartStates).toEqual({ foo: 'bar' });
  });

  test('should set quickstarts states from function', async () => {
    const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;

    const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

    act(() => {
      result.current.setAllQuickStartStates(() => ({ foo: 'bar' }));
    });
    expect(result.current.allQuickStartStates).toEqual({ foo: 'bar' });
  });

  test('should post quickstarts progress update to quickstarts API', async () => {
    postSpy.mockImplementationOnce(() =>
      Promise.resolve({
        quickstartName: 'test-id',
        progress: 'updated-state',
      })
    );
    const wrapper = ({ children }) => (
      <WrapperComponent
        contextValue={{
          ready: true,
          user: {
            identity: {
              internal: {
                account_id: NaN,
              },
            },
          },
        }}
      >
        {children}
      </WrapperComponent>
    );

    const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

    act(() => {
      result.current.setActiveQuickStartID('test-id');
      result.current.setAllQuickStartStates(() => ({ 'test-id': ['initial-state'] }));
    });

    await act(async () => {
      result.current.setAllQuickStartStates(() => ({ 'test-id': ['updated-state'] }));
    });
    expect(result.current.allQuickStartStates).toEqual({ 'test-id': ['updated-state'] });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith('/api/quickstarts/v1/progress', { accountId: NaN, progress: ['updated-state'], quickstartName: 'test-id' });
  });
});
