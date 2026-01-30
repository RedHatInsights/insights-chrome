import { localQuery } from './localSearch';
import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import type { ChromeSearchAPI, SearchDataType, SearchEntry } from '@redhat-cloud-services/types';
import { getDB, insertEntry } from '../state/atoms/localSearchAtom';

export const searchAPI: ChromeSearchAPI = {
  async query(term: string, type: SearchDataType | string, env: ReleaseEnv = ReleaseEnv.STABLE) {
    const db = await getDB();
    return localQuery(db, term, env, type);
  },

  async insert(data: SearchEntry): Promise<void> {
    try {
      const db = await getDB();

      await insertEntry(db, data);
    } catch (error) {
      console.warn('Insert not available:', error);
    }
  },
};
