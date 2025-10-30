import localforage from 'localforage';
import { deleteLocalStorageItems, lastActive } from './common';

export const createCacheStore = (endpoint: string, cacheKey: string) => {
  const name = lastActive(endpoint, cacheKey);

  return localforage.createInstance({
    driver: [localforage.LOCALSTORAGE],
    name: typeof name === 'string' ? name?.split('/')[0] : name.expires.split('/')[0],
  });
};

let store: LocalForage;

export class CacheAdapter {
  maxAge: number;
  expires: number;
  name?: string;
  endpoint?: string;
  cacheKey?: string;
  constructor(endpoint: string, cacheKey: string, maxAge = 10 * 60 * 1000) {
    this.maxAge = maxAge;
    this.expires = new Date().getTime() + this.maxAge;
    if (!store) {
      const name = lastActive(endpoint, cacheKey);
      let cached;
      const cacheId = typeof name === 'string' ? name : name.expires;
      try {
        cached = JSON.parse(localStorage.getItem(cacheId) || '');
      } catch (e) {
        cached = localStorage.getItem(cacheId);
      }
      this.name = cacheId;
      this.endpoint = endpoint;
      this.cacheKey = cacheKey;
      store = createCacheStore(endpoint, cacheKey);
      if (new Date(parseInt(cached?.expires, 10)) >= new Date()) {
        this.setCache(parseInt(cached?.expires, 10), cached?.data);
      } else {
        const cacheTime = new Date().getTime() + this.maxAge;
        this.setCache(cacheTime, {});
      }
    }
  }

  async setCache(expires: number, data: unknown) {
    this.expires = expires;
    if (this.endpoint) {
      await store.setItem(this.endpoint, {
        data,
        expires,
      });
    }
  }

  async invalidateStore() {
    if (new Date(this.expires) <= new Date()) {
      deleteLocalStorageItems(Object.keys(localStorage).filter((item) => item.endsWith('/chrome')));
      await localforage.dropInstance();
      if (this.endpoint && this.cacheKey) {
        store = createCacheStore(this.endpoint, this.cacheKey);
        const cacheTime = new Date().getTime() + this.maxAge;
        await this.setCache(cacheTime, {});
      }
    }
  }

  async setItem<T = { data?: unknown }>(key: string, data: T) {
    await this.invalidateStore();
    if (this.endpoint) {
      const cachedData = await store.getItem<{ data?: Record<string, unknown> }>(this.endpoint);
      if (cachedData != null) {
        cachedData.data = {
          ...cachedData?.data,
          [key]: data,
        };
      }
      await store.setItem(this.endpoint, cachedData);
    }
  }

  async getItem<T = unknown>(key: string): Promise<T | unknown> {
    await this.invalidateStore();
    if (this.endpoint) {
      const cachedData = await store.getItem<{ data?: Record<string, unknown> }>(this.endpoint);
      return cachedData?.data?.[key];
    }
    return Promise.resolve();
  }
}
