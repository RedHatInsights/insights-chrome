import * as cache from './cache';

jest.mock('localforage', () => {
  const actual = jest.requireActual('localforage');
  return {
    __esModule: true,
    default: {
      ...actual,
      createInstance: () => ({
        setItem: async (key: string, data: string) => window.localStorage.setItem(key, data),
        getItem: async (key: string) => {
          window.localStorage.getItem(key);
          return JSON.parse('{"data": {}, "expires": 1}');
        },
      }),
      dropInstance: async () => undefined,
    },
  };
});

describe('CacheAdapter', () => {
  const setItem = jest.fn();
  const getItem = jest.fn();
  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
    Object.defineProperty(global.window, 'localStorage', {
      writable: true,
      value: {
        setItem,
        getItem,
      },
    });
  });

  it('should create empty cache', () => {
    const store = new cache.CacheAdapter('test/test', 'test');
    store.invalidateStore();
    expect(getItem).toHaveBeenCalled();
    expect(store.expires > new Date().getTime()).toBe(true);
  });

  it('should invalidate store', async () => {
    jest.useFakeTimers();
    const store = new cache.CacheAdapter('test/test', 'test', 1);
    // advance time to expire the store
    jest.advanceTimersByTime(90 * 1000);
    expect(store.expires < new Date().getTime()).toBe(true);
    await store.setItem('something', 'data');
  });

  it('should get item', async () => {
    const store = new cache.CacheAdapter('test/test', 'test');
    await store.getItem('something');
  });

  it('should get store from memory', () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem,
        getItem: () =>
          JSON.stringify({
            expires: new Date().getTime() + 10000,
          }),
      },
    });
  });
});
