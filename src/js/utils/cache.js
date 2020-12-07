import { lastActive, deleteLocalStorageItems } from '../utils';

import localforage from 'localforage';

export const createCacheStore = (endpoint, cacheKey) => {
  const name = lastActive(endpoint, cacheKey);

  return localforage.createInstance({
    driver: [localforage.LOCALSTORAGE],
    name: name?.split('/')[0] || name,
  });
};

let store;

/**
 * Check if the app has switched between beta/non-beta envs.
 * If it did, we clean the existing chrome cache to prevent stale cache entry.
 * This issue may occur when the user switches between envs without logging out and in.
 */
const envSwap = () => {
  const currentEnv = window.insights.chrome.isBeta() ? 'beta' : 'non-beta';
  const prevEnv = localStorage.getItem('chrome:prevEnv');
  if (prevEnv && currentEnv !== prevEnv) {
    deleteLocalStorageItems(Object.keys(localStorage).filter((item) => item.endsWith('/chrome-store')));
  }
  localStorage.setItem('chrome:prevEnv', currentEnv);
};

export class CacheAdapter {
  constructor(endpoint, cacheKey, maxAge = 10 * 60 * 1000) {
    this.maxAge = maxAge;
    this.expires = new Date().getTime() + this.maxAge;
    envSwap();
    if (!store) {
      const name = lastActive(endpoint, cacheKey);
      let cached;
      try {
        cached = JSON.parse(localStorage.getItem(name));
      } catch (e) {
        cached = localStorage.getItem(name);
      }
      this.name = name;
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

  async setCache(expires, data) {
    this.expires = expires;
    await store.setItem(this.endpoint, {
      data,
      expires,
    });
  }

  async invalidateStore() {
    if (new Date(this.expires) <= new Date()) {
      deleteLocalStorageItems(Object.keys(localStorage).filter((item) => item.endsWith('/chrome')));
      await localforage.dropInstance();
      store = createCacheStore(this.endpoint, this.cacheKey);
      const cacheTime = new Date().getTime() + this.maxAge;
      await this.setCache(cacheTime, {});
    }
  }

  async setItem(key, data) {
    await this.invalidateStore();
    const cachedData = await store.getItem(this.endpoint);
    cachedData.data = {
      ...cachedData?.data,
      [key]: data,
    };
    await store.setItem(this.endpoint, cachedData);
  }

  async getItem(key) {
    await this.invalidateStore();
    const cachedData = await store.getItem(this.endpoint);
    return cachedData?.data?.[key];
  }
}
