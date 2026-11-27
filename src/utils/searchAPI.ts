import { consoleSearch } from './consoleSearch';
import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import type { ChromeSearchAPI, SearchDataType, SearchEntry } from '@redhat-cloud-services/types';
import { getDB, insertEntry } from '../state/atoms/localSearchAtom';

export const searchAPI: ChromeSearchAPI = {
  async query(term: string, type: SearchDataType | string, env: ReleaseEnv = ReleaseEnv.STABLE) {
    try {
      const { results } = await consoleSearch({ db: getDB(), term, env, type });
      return results;
    } catch (error) {
      // Tenant apps rely on query() resolving (local search never rejects), so report and return no results.
      console.error('[chrome] Search query failed:', error);
      return [];
    }
  },

  async insert(data: SearchEntry): Promise<void> {
    try {
      const db = getDB();

      await insertEntry(db, data);
    } catch (error) {
      console.warn('Insert not available:', error);
    }
  },
};
