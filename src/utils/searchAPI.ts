import { Orama, create, insert, search } from '@orama/orama';
import { ReleaseEnv } from '../@types/types.d';
import { SearchPermissions, SearchPermissionsCache } from '../state/atoms/localSearchAtom';
import { evaluateVisibility } from './isNavItemVisible';
import { localQuery } from './localSearch';
import { NavItemPermission } from '../@types/types';

export type SearchDataType = 'help-docs' | 'quickstarts' | 'general' | string;

export interface SearchEntry {
  id: string;
  title: string;
  description: string;
  pathname: string;
  bundleTitle: string;
  altTitle?: string[];
  type: SearchDataType;
  permissions?: NavItemPermission[];
}

const searchSchema = {
  id: 'string',
  title: 'string',
  description: 'string',
  altTitle: 'string[]',
  bundleTitle: 'string',
  pathname: 'string',
  type: 'string',
} as const;

export class SearchStore {
  private databases: Map<SearchDataType, Orama<typeof searchSchema>> = new Map();
  private dataCache: Map<SearchDataType, SearchEntry[]> = new Map();

  async getDatabase(type: SearchDataType): Promise<Orama<typeof searchSchema>> {
    if (!this.databases.has(type)) {
      const db = await create({
        schema: searchSchema,
      });
      this.databases.set(type, db);
    }
    return this.databases.get(type)!;
  }

  async fillStore(type: SearchDataType, data: SearchEntry[]): Promise<void> {
    const db = await this.getDatabase(type);
    this.dataCache.set(type, data);

    const insertPromises = data.map((entry) =>
      insert(db, {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        altTitle: entry.altTitle || [],
        bundleTitle: entry.bundleTitle,
        pathname: entry.pathname,
        type: entry.type,
      })
    );

    await Promise.all(insertPromises);

    // Update permissions cache
    data.forEach((entry) => {
      if (entry.permissions) {
        SearchPermissions.set(entry.id, entry.permissions);
      }
    });
  }

  async query(term: string, type: SearchDataType = '', env: ReleaseEnv = ReleaseEnv.STABLE, limit: number = 10): Promise<SearchEntry[]> {
    // For empty type, use global search via localQuery
    if (!type) {
      const { asyncLocalOrama } = await import('../state/atoms/localSearchAtom');
      const db = await asyncLocalOrama;
      const results = await localQuery(db, term, env, false);
      return results.map((result) => ({
        ...result,
        type: 'legacy' as SearchDataType,
      }));
    }

    const db = await this.getDatabase(type);

    try {
      const results = await search(db, {
        term,
        threshold: 0.5,
        tolerance: 1.5,
        properties: ['title', 'description', 'altTitle'],
        boost: {
          title: 10,
          altTitle: 5,
          description: 3,
        },
        limit,
      });

      const formattedResults = [];
      for (const hit of results.hits) {
        if (formattedResults.length >= limit) {
          break;
        }

        const { document } = hit;
        const hasPermission = await this.checkPermissions(document.id, env);
        if (hasPermission) {
          formattedResults.push({
            id: document.id,
            title: document.title,
            description: document.description,
            bundleTitle: document.bundleTitle,
            pathname: document.pathname,
            type: document.type,
          });
        }
      }

      return formattedResults;
    } catch (error) {
      console.error('Search query failed:', error);
      return [];
    }
  }

  private async checkPermissions(id: string, env: ReleaseEnv): Promise<boolean> {
    const cacheKey = `${env}-${id}`;
    const cacheHit = SearchPermissionsCache.get(cacheKey);
    if (cacheHit !== undefined) {
      return !cacheHit; // Cache stores isHidden, we want !isHidden
    }

    const permissions = SearchPermissions.get(id);
    const result = !!(await evaluateVisibility({ id, permissions }))?.isHidden;
    SearchPermissionsCache.set(cacheKey, result);
    return !result;
  }

  getAvailableTypes(): SearchDataType[] {
    return Array.from(this.databases.keys());
  }

  async clearType(type: SearchDataType): Promise<void> {
    this.databases.delete(type);
    this.dataCache.delete(type);
  }

  getCachedData(type: SearchDataType): SearchEntry[] | undefined {
    return this.dataCache.get(type);
  }
}

const searchStore = new SearchStore();

export interface ChromeSearchAPI {
  fillStore: (type: SearchDataType, data: SearchEntry[]) => Promise<void>;
  query: (term: string, type?: SearchDataType, env?: ReleaseEnv, limit?: number) => Promise<SearchEntry[]>;
  getAvailableTypes: () => SearchDataType[];
  clearType: (type: SearchDataType) => Promise<void>;
  getCachedData: (type: SearchDataType) => SearchEntry[] | undefined;
}

export const createSearchAPI = (isTest = false): ChromeSearchAPI => {
  const api = {
    fillStore: (type: SearchDataType, data: SearchEntry[]) => searchStore.fillStore(type, data),
    query: (term: string, type: SearchDataType = '', env: ReleaseEnv = ReleaseEnv.STABLE, limit: number = 10) =>
      searchStore.query(term, type, env, limit),
    getAvailableTypes: () => searchStore.getAvailableTypes(),
    clearType: (type: SearchDataType) => searchStore.clearType(type),
    getCachedData: (type: SearchDataType) => searchStore.getCachedData(type),
  };

  if (isTest) {
    (api as any)._store = searchStore;
  }

  return api;
};
