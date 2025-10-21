import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
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

const WrapperComponent = ({ children, contextValue = mockChromeContextValue }) => (
  <ChromeAuthContext.Provider value={contextValue}>
    <JotaiProvider>{children}</JotaiProvider>
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

  describe('activateQuickstart', () => {
    let mockMainQuickstart;

    beforeEach(() => {
      mockMainQuickstart = {
        content: {
          metadata: { name: 'main-quickstart' },
          spec: {
            displayName: 'Main Quickstart',
            nextQuickStart: ['next-quickstart-1', 'next-quickstart-2'],
          },
        },
      };
    });

    test('should fetch and activate a single quickstart without nextQuickStart references', async () => {
      mockMainQuickstart = JSON.parse(JSON.stringify(mockMainQuickstart)); // clone
      delete mockMainQuickstart.content.spec.nextQuickStart;

      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockMainQuickstart] } }));

      const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
      const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

      await act(async () => {
        await result.current.activateQuickstart('main-quickstart');
      });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith('/api/quickstarts/v1/quickstarts', {
        params: { name: 'main-quickstart' },
      });
      expect(result.current.activeQuickStartID).toBe('main-quickstart');
    });

    test('should fetch main quickstart and referenced quickstarts from nextQuickStart array', async () => {
      const mockNextQuickstart1 = {
        content: {
          metadata: { name: 'next-quickstart-1' },
          spec: { displayName: 'Next Quickstart 1' },
        },
      };

      const mockNextQuickstart2 = {
        content: {
          metadata: { name: 'next-quickstart-2' },
          spec: { displayName: 'Next Quickstart 2' },
        },
      };

      // Mock the main quickstart call
      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockMainQuickstart] } }));

      // Mock the referenced quickstart calls
      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockNextQuickstart1] } }));
      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockNextQuickstart2] } }));

      const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
      const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

      await act(async () => {
        await result.current.activateQuickstart('main-quickstart');
      });

      expect(getSpy).toHaveBeenCalledTimes(3);
      expect(getSpy).toHaveBeenNthCalledWith(1, '/api/quickstarts/v1/quickstarts', {
        params: { name: 'main-quickstart' },
      });
      expect(getSpy).toHaveBeenNthCalledWith(2, '/api/quickstarts/v1/quickstarts', {
        params: { name: 'next-quickstart-1' },
      });
      expect(getSpy).toHaveBeenNthCalledWith(3, '/api/quickstarts/v1/quickstarts', {
        params: { name: 'next-quickstart-2' },
      });
      expect(result.current.activeQuickStartID).toBe('main-quickstart');
    });

    test('should handle duplicate nextQuickStart references', async () => {
      mockMainQuickstart = JSON.parse(JSON.stringify(mockMainQuickstart)); // clone
      mockMainQuickstart.content.spec.nextQuickStart = ['next-quickstart-1', 'next-quickstart-1']; // duplicate

      const mockNextQuickstart = {
        content: {
          metadata: { name: 'next-quickstart-1' },
          spec: { displayName: 'Next Quickstart 1' },
        },
      };

      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockMainQuickstart] } }));
      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockNextQuickstart] } }));

      const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
      const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

      await act(async () => {
        await result.current.activateQuickstart('main-quickstart');
      });

      // Should only make 2 calls (1 main + 1 deduplicated next)
      expect(getSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle empty nextQuickStart array', async () => {
      mockMainQuickstart = JSON.parse(JSON.stringify(mockMainQuickstart)); // clone
      mockMainQuickstart.content.spec.nextQuickStart = [];

      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockMainQuickstart] } }));

      const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
      const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

      await act(async () => {
        await result.current.activateQuickstart('main-quickstart');
      });

      // Should only make 1 call for the main quickstart
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(result.current.activeQuickStartID).toBe('main-quickstart');
    });

    test('should handle errors when fetching referenced quickstarts gracefully', async () => {
      mockMainQuickstart = JSON.parse(JSON.stringify(mockMainQuickstart)); // clone
      mockMainQuickstart.content.spec.nextQuickStart = ['non-existent-quickstart'];

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      getSpy.mockImplementationOnce(() => Promise.resolve({ data: { data: [mockMainQuickstart] } }));
      getSpy.mockImplementationOnce(() => Promise.reject(new Error('Quickstart not found')));

      const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
      const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

      await act(async () => {
        await result.current.activateQuickstart('main-quickstart');
      });

      expect(getSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Some referenced quickstarts could not be fetched:', expect.any(Error));
      expect(result.current.activeQuickStartID).toBe('main-quickstart');

      consoleWarnSpy.mockRestore();
    });

    test('should handle main quickstart fetch error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      getSpy.mockImplementationOnce(() => Promise.reject(new Error('Main quickstart fetch failed')));

      const wrapper = ({ children }) => <WrapperComponent>{children}</WrapperComponent>;
      const { result } = renderHook(() => useQuickstartsStates(), { wrapper });

      await act(async () => {
        await result.current.activateQuickstart('main-quickstart');
      });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unable to active quickstarts called: ', 'main-quickstart', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});
