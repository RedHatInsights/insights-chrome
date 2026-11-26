import { atom } from 'jotai';
import { Orama, components, create, getByID, insert } from '@orama/orama';
import type { SearchDataType, SearchEntry } from '@redhat-cloud-services/types';

import { getChromeStaticPathname } from '../../utils/common';
import axios, { AxiosResponse } from 'axios';
import { NavItemPermission } from '../../@types/types';
import { bundleMapping, getUrl } from '../../hooks/useBundle';
import { cacheFetch } from '../../utils/cacheFetch';
import { CONFIG_SOURCES, reportConfigSource } from '../../utils/configCacheStatus';
import { feoMessagesAtom } from './feoLocaleAtom';
import { localizeSearchEntry } from '../../utils/feoLocalization';
import { createSearchTokenizer } from '../../utils/searchTokenizer';

type IndexEntry = {
  icon?: string;
  title: string[];
  bundle: string[];
  bundleTitle: string[];
  id: string;
  uri: string;
  relative_uri: string;
  poc_description_t: string;
  alt_title: string[];
  permissions?: NavItemPermission[];
};

type GeneratedSearchIndexResponse = {
  alt_title?: string[];
  id: string;
  href: string;
  title: string;
  description?: string;
};

const GENERATED_SEARCH_INDEX_PATH = '/api/chrome-service/v1/static/search-index-generated.json';

const isGeneratedSearchIndex = (data: unknown): data is GeneratedSearchIndexResponse[] => {
  return (
    Array.isArray(data) &&
    data.every((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return false;
      }

      const value = entry as Record<string, unknown>;
      return (
        typeof value.id === 'string' &&
        typeof value.href === 'string' &&
        typeof value.title === 'string' &&
        (value.description === undefined || typeof value.description === 'string') &&
        (value.alt_title === undefined || (Array.isArray(value.alt_title) && value.alt_title.every((title) => typeof title === 'string')))
      );
    })
  );
};

export const loadGeneratedSearchIndex = async (): Promise<GeneratedSearchIndexResponse[]> => {
  try {
    const { data, fromCache } = await cacheFetch(
      CONFIG_SOURCES.SEARCH_INDEX,
      () =>
        axios.get<unknown>(GENERATED_SEARCH_INDEX_PATH).then((response) => {
          if (!isGeneratedSearchIndex(response.data)) {
            throw new Error('search-index-generated.json: invalid payload');
          }
          return response.data;
        }),
      undefined,
      isGeneratedSearchIndex
    );
    reportConfigSource(CONFIG_SOURCES.SEARCH_INDEX, fromCache);
    if (fromCache) {
      console.warn('[chrome] Search index loaded from IndexedDB cache (origin unavailable)');
    }
    return data;
  } catch (error) {
    reportConfigSource(CONFIG_SOURCES.SEARCH_INDEX, false);
    throw error;
  }
};

export const SearchPermissions = new Map<string | number, NavItemPermission[]>();
export const SearchPermissionsCache = new Map<string, boolean>();

/**
 * Parse a URL string and return the URL object only if its protocol is http: or https:.
 * Returns undefined for non-http(s) schemes (e.g. javascript:, data:) or invalid URLs.
 */
const parseHttpUrl = (value: string): URL | undefined => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const bundleCache = new Map<string, string>();
export const getBundleTitle = (pathname: string): string => {
  const bundle = getUrl('bundle', pathname);
  const cachedBundle = bundleCache.get(bundle);
  if (cachedBundle) {
    return cachedBundle;
  }

  const bundleTitle = bundleMapping[bundle] || bundle;
  bundleCache.set(bundle, bundleTitle);
  return bundleTitle;
};

const asyncSearchIndexAtom = atom(async () => {
  const staticPath = getChromeStaticPathname('search');
  const searchIndex: (SearchEntry & { feoGenerated?: boolean })[] = [];
  const idSet = new Set<string>();
  const searchRequests: [Promise<AxiosResponse<IndexEntry[]>>, Promise<GeneratedSearchIndexResponse[]>] = [
    axios.get<IndexEntry[]>(`${staticPath}/search-index.json`),
    loadGeneratedSearchIndex(),
  ];

  const [legacyIndex, generatedIndex] = await Promise.allSettled(searchRequests);

  if (generatedIndex.status === 'fulfilled') {
    generatedIndex.value.forEach((entry) => {
      if (idSet.has(entry.id)) {
        console.warn('Duplicate id found in index', entry.id);
        return;
      }

      const isInternalPath = entry.href.startsWith('/');
      const externalUrl = isInternalPath ? undefined : parseHttpUrl(entry.href);
      if (!isInternalPath && !externalUrl) {
        // Skip non-http(s) URLs (e.g. javascript:, data:) for security
        console.warn('Skipping non-http(s) search entry', entry.id);
        return;
      }
      idSet.add(entry.id);
      SearchPermissions.set(entry.id, []);
      const bundleTitle = isInternalPath ? getBundleTitle(entry.href) : externalUrl?.hostname || 'External';
      searchIndex.push({
        feoGenerated: true,
        title: entry.title,
        uri: entry.href,
        pathname: entry.href,
        description: entry.description ?? entry.href,
        icon: undefined,
        id: entry.id,
        bundleTitle: bundleTitle,
        altTitle: entry.alt_title,
        type: 'services' as SearchDataType,
      });
    });
  }

  if (legacyIndex.status === 'fulfilled') {
    legacyIndex.value.data.forEach((entry) => {
      if (idSet.has(entry.id)) {
        console.warn('Duplicate id found in index', entry.id);
        return;
      }

      idSet.add(entry.id);
      SearchPermissions.set(entry.id, entry.permissions ?? []);
      searchIndex.push({
        title: entry.title[0],
        uri: entry.uri,
        pathname: entry.relative_uri,
        description: entry.poc_description_t || entry.relative_uri,
        icon: entry.icon,
        id: entry.id,
        bundleTitle: entry.bundleTitle[0],
        altTitle: entry.alt_title,
        type: 'services' as SearchDataType,
      });
    });
  }

  return searchIndex;
});

export const entrySchema = {
  title: 'string',
  description: 'string',
  altTitle: 'string[]',
  descriptionMatch: 'string',
  bundleTitle: 'string',
  pathname: 'string',
  type: 'string',
  isExternal: 'boolean',
} as const;

// Translated entries share the index with English ones; see searchTokenizer.
export function createSearchDb() {
  return create({ schema: entrySchema, components: { tokenizer: createSearchTokenizer() } });
}

export function validateSearchEntry(entry: SearchEntry) {
  if (typeof entry.id !== 'string' || typeof entry.pathname !== 'string') throw new Error('Search entry requires string id and pathname');
  const isInternalPath = entry.pathname.startsWith('/');
  const externalUrl = isInternalPath ? undefined : parseHttpUrl(entry.pathname);
  if (!isInternalPath && !externalUrl) {
    // Skip non-http(s) URLs for security
    console.warn('Skipping non-http(s) search entry', entry.id);
    return undefined;
  }
  const isExternal = Boolean(externalUrl);
  const document = {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    descriptionMatch: entry.description,
    altTitle: entry.altTitle ?? [],
    bundleTitle: entry.bundleTitle,
    pathname: entry.pathname,
    type: entry.type,
    isExternal,
  };
  const invalidField = components.validateSchema(document, entrySchema);
  if (invalidField) throw new Error(`Invalid search entry field: ${invalidField}`);
  return document;
}

export function insertEntry(db: Orama<typeof entrySchema>, entry: SearchEntry) {
  const document = validateSearchEntry(entry);
  return document ? insert(db, document) : Promise.resolve(entry.id);
}

// This per-store registry is deliberately non-reactive. Remote inserts mutate
// the live index; only future locale builds replay the retained entries.
const registeredSearchEntriesAtom = atom(() => new Map<string, SearchEntry>());
export const insertSearchEntryAtom = atom(null, async (get, _set, entry: SearchEntry) => {
  const snapshot = { ...entry, altTitle: entry.altTitle?.slice() };
  const document = validateSearchEntry(snapshot);
  if (!document) return undefined;
  const entries = get(registeredSearchEntriesAtom);
  if (!entries.has(snapshot.id)) entries.set(snapshot.id, snapshot);
  const db = await get(asyncLocalOrama);
  if (!getByID(db, snapshot.id)) await insert(db, document);
  return db;
});

export const asyncLocalOrama = atom(async (get) => {
  const messages = get(feoMessagesAtom);
  const registered = get(registeredSearchEntriesAtom);
  // Each locale gets its own DB: in-flight builds cannot mutate the current one.
  const db = createSearchDb();
  const entries = await get(asyncSearchIndexAtom);
  const baseIds = new Set(entries.map(({ id }) => id));
  await Promise.all([
    ...entries.map((entry) => {
      if (!entry.feoGenerated) return insertEntry(db, entry);
      return insertEntry(db, localizeSearchEntry(entry, entry.pathname.startsWith('/') ? getUrl('bundle', entry.pathname) : undefined, messages));
    }),
    ...[...registered.values()].filter(({ id }) => !baseIds.has(id)).map((entry) => insertEntry(db, entry)),
  ]);
  return db;
});
