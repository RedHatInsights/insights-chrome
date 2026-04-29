import { atom } from 'jotai';
import { Orama, create, insert } from '@orama/orama';
import type { SearchDataType, SearchEntry } from '@redhat-cloud-services/types';

import { getChromeStaticPathname } from '../../utils/common';
import axios, { AxiosResponse } from 'axios';
import { NavItemPermission } from '../../@types/types';
import { bundleMapping, getUrl } from '../../hooks/useBundle';

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
  const searchIndex: SearchEntry[] = [];
  const idSet = new Set<string>();
  const searchRequests: [Promise<AxiosResponse<IndexEntry[]>>, Promise<AxiosResponse<GeneratedSearchIndexResponse[]>>] = [
    axios.get<IndexEntry[]>(`${staticPath}/search-index.json`),
    axios.get<GeneratedSearchIndexResponse[]>(`/api/chrome-service/v1/static/search-index-generated.json`),
  ];

  const [legacyIndex, generatedIndex] = await Promise.allSettled(searchRequests);

  if (generatedIndex.status === 'fulfilled') {
    generatedIndex.value.data.forEach((entry) => {
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

export function insertEntry(db: Orama<typeof entrySchema>, entry: SearchEntry) {
  const isInternalPath = entry.pathname.startsWith('/');
  const externalUrl = isInternalPath ? undefined : parseHttpUrl(entry.pathname);
  if (!isInternalPath && !externalUrl) {
    // Skip non-http(s) URLs for security
    console.warn('Skipping non-http(s) search entry', entry.id);
    return Promise.resolve(entry.id);
  }
  const isExternal = Boolean(externalUrl);
  return insert(db, {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    descriptionMatch: entry.description,
    altTitle: entry.altTitle ?? [],
    bundleTitle: entry.bundleTitle,
    pathname: entry.pathname,
    type: entry.type,
    isExternal,
  });
}

const db: { current: Orama<typeof entrySchema> | undefined } = { current: undefined };
export function getDB() {
  if (!db.current) {
    db.current = create({
      schema: entrySchema,
    });
  }

  return db.current;
}

export const asyncLocalOrama = atom(async (get) => {
  const db = getDB();

  const insertCommands = (await get(asyncSearchIndexAtom)).map(async (entry) => {
    return insertEntry(db, entry);
  });

  await Promise.all(insertCommands);
  return db;
});
