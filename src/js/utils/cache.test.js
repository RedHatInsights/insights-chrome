const cache = require('./cache');
const setItem = jest.fn();
const getItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem,
    getItem,
  },
});
cache.__set__('localforage', {
  createInstance: () => ({
    setItem: async (key, data) => window.localStorage.setItem(key, data),
    getItem: async (key) => {
      window.localStorage.getItem(key);
      return JSON.parse('{"data": {}, "expires": 1}');
    },
  }),
  dropInstance: async () => {},
});

describe('CacheAdapter', () => {
  beforeEach(() => {
    cache.__set__('store', undefined);
  });

  it('should create empty cache', () => {
    const store = new cache.CacheAdapter('test/test', 'test');
    expect(getItem).toHaveBeenCalled();
    expect(store.expires > new Date().getTime()).toBe(true);
  });

  it('should invalidate store', (done) => {
    const store = new cache.CacheAdapter('test/test', 'test', 1);
    setTimeout(async () => {
      expect(store.expires < new Date().getTime()).toBe(true);
      await store.setItem('something', 'data');
      done();
    }, 2);
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
            expires: new Date().getTime + 10000,
          }),
      },
    });
  });
});
