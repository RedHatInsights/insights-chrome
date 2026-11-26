import { invalidateLocalQueryCache, localQuery } from './localSearch';
import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import type { ChromeSearchAPI, SearchDataType, SearchEntry } from '@redhat-cloud-services/types';
import { asyncLocalOrama, insertSearchEntryAtom } from '../state/atoms/localSearchAtom';
import chromeStore from '../state/chromeStore';

export const searchAPI: ChromeSearchAPI = {
  async query(term: string, type: SearchDataType | string, env: ReleaseEnv = ReleaseEnv.STABLE) {
    const db = await chromeStore.get(asyncLocalOrama);
    return localQuery(db, term, env, type);
  },

  async insert(data: SearchEntry): Promise<void> {
    try {
      const db = await chromeStore.set(insertSearchEntryAtom, data);
      if (db) invalidateLocalQueryCache(db);
    } catch (error) {
      console.warn('Insert not available:', error);
    }
  },
};
