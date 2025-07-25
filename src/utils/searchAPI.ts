import { Orama, create, insert, search } from '@orama/orama';
import { createStore } from 'jotai';
type Store = ReturnType<typeof createStore>;
import { ReleaseEnv } from '../@types/types.d';
import { SearchPermissions, SearchPermissionsCache } from '../state/atoms/localSearchAtom';
import { evaluateVisibility } from './isNavItemVisible';
import { localQuery } from './localSearch';
import type { SearchDataType, SearchEntry } from '@redhat-cloud-services/types';

type OramaSearchSchema = {
  id: 'string';
  title: 'string';
  description: 'string';
  altTitle: 'string[]';
  bundleTitle: 'string';
  pathname: 'string';
  type: 'string';
};

const searchSchema: OramaSearchSchema = {
  id: 'string',
  title: 'string',
  description: 'string',
  altTitle: 'string[]',
  bundleTitle: 'string',
  pathname: 'string',
  type: 'string',
};

export class SearchStore {
  private databases: Map<SearchDataType, Orama<typeof searchSchema>> = new Map();
  private dataCache: Map<SearchDataType, SearchEntry[]> = new Map();

  constructor(private store: Store) {}

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
    // Cast to InternalSearchEntry for internal storage
    const internalData = data as SearchEntry[];
    this.dataCache.set(type, internalData);

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

    // Update permissions cache for entries with permissions
    internalData.forEach((entry) => {
      if (entry.permissions) {
        SearchPermissions.set(entry.id, entry.permissions);
      }
    });
  }

  async query(term: string, type?: SearchDataType, env: string = 'stable', limit: number = 10): Promise<SearchEntry[]> {
    // For empty type, use global search via localQuery
    if (!type) {
      try {
        const { asyncLocalOrama } = await import('../state/atoms/localSearchAtom');
        const db = await this.store.get(asyncLocalOrama);
        // Convert env string to ReleaseEnv for localQuery
        const releaseEnv = env === 'beta' ? ReleaseEnv.PREVIEW : ReleaseEnv.STABLE;
        const results = await localQuery(db, term, releaseEnv, false);
        return results.map((result) => ({
          ...result,
          uri: result.pathname, // Add uri field for ChromeAPI compatibility
          type: 'legacy' as SearchDataType,
        }));
      } catch (error) {
        // If global search fails (e.g., dependencies not available), return empty results
        console.warn('Global search not available:', error);
        return [];
      }
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

      const formattedResults: SearchEntry[] = [];
      for (const hit of results.hits) {
        if (formattedResults.length >= limit) {
          break;
        }

        const { document } = hit;
        // Convert env string to ReleaseEnv for permission check
        const releaseEnv = env === 'beta' ? ReleaseEnv.PREVIEW : ReleaseEnv.STABLE;
        const hasPermission = await this.checkPermissions(document.id, releaseEnv);
        if (hasPermission) {
          formattedResults.push({
            id: document.id,
            title: document.title,
            description: document.description,
            uri: document.pathname, // Add uri field for ChromeAPI compatibility
            pathname: document.pathname,
            bundleTitle: document.bundleTitle,
            altTitle: [],
            type: document.type as SearchDataType,
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
    const cachedData = this.dataCache.get(type);
    if (!cachedData) return undefined;

    // Convert InternalSearchEntry to SearchEntry by ensuring uri field is present
    return cachedData.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      uri: entry.uri || entry.pathname, // Use uri if available, otherwise use pathname
      pathname: entry.pathname,
      bundleTitle: entry.bundleTitle,
      altTitle: entry.altTitle,
      icon: entry.icon,
      type: entry.type,
    }));
  }
}

const store = createStore();
export const searchAPI = new SearchStore(store);
