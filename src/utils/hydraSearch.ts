/**
 * POC: query console search entries from the Red Hat common search backend (Solr behind Hydra)
 * instead of the in-browser Orama index. See ADR-094 (architecture repo).
 *
 * Integration rules from the Search API docs:
 * - Only use the supported `https://{host}/hydra/rest/search/...` endpoints.
 * - Do not send the deprecated `redhat_client` / `clientName` params (rejected from 2026-10-01).
 * - Front-end origin calls identify themselves with the `X-User-Agent` header.
 * - Never ship an `X-API-Key` in browser code. If a key becomes required, the request has to be
 *   proxied through a backend (e.g. chrome-service) that adds it server-side.
 */
import sanitizeHtml from 'sanitize-html';
import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import { getBundleTitle } from '../state/atoms/localSearchAtom';
import { getUnleashClient, unleashClientExists } from '../components/FeatureFlags/unleashClient';
import { type SearchResultItem, checkResultPermissions, highlightText } from './localSearch';
import { isProd } from './common';

export const HYDRA_SEARCH_FLAG = 'platform.chrome.search.hydra';
/** localStorage override for the flag: 'true' | 'false'. Wins over Unleash; intended for POC testing. */
export const HYDRA_SEARCH_OVERRIDE_KEY = 'chrome:search:hydra';
/** localStorage override for the endpoint. Must be an https URL on a redhat.com host. */
export const HYDRA_SEARCH_URL_OVERRIDE_KEY = 'chrome:search:hydra:url';

/**
 * Console entries uploaded by chrome-service (`POST /hydra/rest/search/console/index`) are served
 * from the portal source as `documentKind:ModuleDefinition` documents. Verified against stage and
 * prod on 2026-11-15 (161 documents). `/hydra/rest/search/platform/console` is not a valid path.
 */
export const HYDRA_SEARCH_PATH = '/hydra/rest/search/platform/portal';
export const HYDRA_SEARCH_FILTER = 'documentKind:ModuleDefinition';
export const HYDRA_SEARCH_TIMEOUT_MS = 3_000;
export const HYDRA_SEARCH_MAX_RESULTS = 10;
/** Over-fetch so de-duplication and permission filtering can still fill the result list. */
const HYDRA_SEARCH_ROWS = 25;
const MAX_QUERY_TOKENS = 8;
const RESULT_CACHE_LIMIT = 100;
/** `allTitle` is indexed as "<title> | <bundle title>". */
const ALL_TITLE_DELIMITER = ' | ';

/** Field boosts mirror the Orama configuration in localSearch.ts (title 10, altTitle 5, description 3). */
const QUERY_FIELDS: [field: string, boost: number][] = [
  ['allTitle', 10],
  ['alt_titles', 5],
  ['abstract', 3],
];
const HIGHLIGHT_FIELDS = ['allTitle', 'abstract'];

/** ModuleDefinition document as returned by Hydra (only the fields chrome uses). */
export type HydraConsoleDoc = {
  id: string;
  /** Solr unique key; `highlighting` is keyed by it. Format: `console_<id>`. */
  uri?: string;
  allTitle?: string;
  alt_titles?: string[];
  bundle_title?: string[];
  abstract?: string;
  relative_uri?: string;
  view_uri?: string;
};

export type HydraSearchResponse = {
  response: {
    numFound?: number;
    docs: HydraConsoleDoc[];
  };
  highlighting?: Record<string, Partial<Record<string, string[]>> | undefined>;
};

export class HydraSearchError extends Error {
  constructor(
    message: string,
    public readonly reason: 'timeout' | 'http' | 'network' | 'invalid-response'
  ) {
    super(message);
    this.name = 'HydraSearchError';
  }
}

export function isHydraSearchEnabled(): boolean {
  try {
    const override = localStorage.getItem(HYDRA_SEARCH_OVERRIDE_KEY);
    if (override === 'true' || override === 'false') {
      return override === 'true';
    }
  } catch {
    // storage may be unavailable
  }
  try {
    // Fail closed: without a healthy Unleash client stay on local search.
    return unleashClientExists() && getUnleashClient().isEnabled(HYDRA_SEARCH_FLAG);
  } catch {
    return false;
  }
}

function getUrlOverride(): URL | undefined {
  try {
    const value = localStorage.getItem(HYDRA_SEARCH_URL_OVERRIDE_KEY);
    if (!value) {
      return undefined;
    }
    const url = new URL(value);
    if (url.protocol === 'https:' && (url.hostname === 'redhat.com' || url.hostname.endsWith('.redhat.com'))) {
      return url;
    }
    console.warn(`[chrome] Ignoring ${HYDRA_SEARCH_URL_OVERRIDE_KEY}: must be an https redhat.com URL`);
  } catch {
    // invalid URL or storage unavailable
  }
  return undefined;
}

/** The webpack dev server (`*.foo.redhat.com`) proxies `/hydra/rest/search/` to stage through the corp proxy. */
const isDevServerHost = () => window.location.hostname.endsWith('.foo.redhat.com');

export function getHydraSearchBaseUrl(): URL {
  const override = getUrlOverride();
  if (override) {
    return override;
  }
  if (isDevServerHost()) {
    return new URL(HYDRA_SEARCH_PATH, window.location.origin);
  }
  return new URL(`https://access.${isProd() ? '' : 'stage.'}redhat.com${HYDRA_SEARCH_PATH}`);
}

const SOLR_SPECIAL_CHARS = /[+\-&|!(){}[\]^"~*?:\\/]/g;

export function escapeSolrTerm(token: string): string {
  return token.replace(SOLR_SPECIAL_CHARS, '\\$&');
}

/**
 * Build a Solr standard-parser query. Every token must match (AND), either exactly, as a prefix
 * (type-ahead) or, for tokens of 4+ chars, fuzzily (typos). Tokens are lowercased so AND/OR/NOT
 * typed by the user are never interpreted as operators.
 */
export function buildHydraQuery(term: string): string {
  const tokens = term.trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, MAX_QUERY_TOKENS).map(escapeSolrTerm);
  if (tokens.length === 0) {
    return '';
  }
  const tokenClause = tokens.map((t) => (t.length >= 4 ? `(${t} OR ${t}* OR ${t}~1)` : `(${t} OR ${t}*)`)).join(' AND ');
  return QUERY_FIELDS.map(([field, boost]) => `${field}:(${tokenClause})^${boost}`).join(' OR ');
}

export function buildHydraSearchUrl(term: string): URL {
  const url = getHydraSearchBaseUrl();
  url.searchParams.set('q', buildHydraQuery(term));
  url.searchParams.set('fq', HYDRA_SEARCH_FILTER);
  url.searchParams.set('rows', String(HYDRA_SEARCH_ROWS));
  url.searchParams.set('fl', 'id,uri,allTitle,alt_titles,bundle_title,abstract,relative_uri,view_uri');
  url.searchParams.set('hl', 'true');
  url.searchParams.set('hl.fl', HIGHLIGHT_FIELDS.join(','));
  url.searchParams.set('hl.simple.pre', '<mark>');
  url.searchParams.set('hl.simple.post', '</mark>');
  return url;
}

function getClientIdentity(): string {
  const release = process.env.SENTRY_RELEASE || 'dev';
  return `insights-chrome/${release} (${window.location.hostname})`;
}

const stripHtml = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
/** Backend highlights are rendered with dangerouslySetInnerHTML; only allow bare <mark>. */
const sanitizeHighlight = (value: string) => sanitizeHtml(value, { allowedTags: ['mark'], allowedAttributes: {} });
/** Drop the " | <bundle title>" suffix from `allTitle` (plain or highlighted). */
const titleFromAllTitle = (allTitle: string) => allTitle.split(ALL_TITLE_DELIMITER)[0].trim();

function resolveLink(doc: HydraConsoleDoc): { pathname: string; externalUrl?: URL } | undefined {
  const href = doc.relative_uri || doc.view_uri;
  if (!href) {
    return undefined;
  }
  // Protocol-relative "//host" is an external link in disguise; treat it as untrusted.
  if (href.startsWith('/') && !href.startsWith('//')) {
    return { pathname: href };
  }
  try {
    const url = new URL(href);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { pathname: url.toString(), externalUrl: url };
    }
  } catch {
    // invalid URL
  }
  return undefined;
}

export function isHydraSearchResponse(data: unknown): data is HydraSearchResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const response = (data as { response?: unknown }).response;
  return typeof response === 'object' && response !== null && Array.isArray((response as { docs?: unknown }).docs);
}

/** Map a Solr response to chrome search items, de-duplicated by link. Does not filter permissions. */
export function mapHydraResponse(term: string, data: HydraSearchResponse): SearchResultItem[] {
  const items: SearchResultItem[] = [];
  const seenLinks = new Set<string>();
  for (const doc of data.response.docs) {
    const link = resolveLink(doc);
    if (typeof doc.id !== 'string' || !doc.allTitle || !link || seenLinks.has(link.pathname)) {
      continue;
    }
    seenLinks.add(link.pathname);
    const title = stripHtml(titleFromAllTitle(doc.allTitle));
    const description = stripHtml(doc.abstract || link.pathname);
    const rawBundleTitle = stripHtml(doc.bundle_title?.[0] ?? '').trim();
    const bundleTitle = rawBundleTitle || (link.externalUrl ? link.externalUrl.hostname : getBundleTitle(link.pathname));
    const highlight = data.highlighting?.[doc.uri ?? doc.id];
    const titleHighlight = highlight?.allTitle?.[0];
    const descriptionHighlight = highlight?.abstract?.[0];

    items.push({
      id: doc.id,
      title: titleHighlight ? sanitizeHighlight(titleFromAllTitle(titleHighlight)) : highlightText(term, title, 'title'),
      description: descriptionHighlight ? sanitizeHighlight(descriptionHighlight) : highlightText(term, description, 'description'),
      bundleTitle,
      pathname: link.pathname,
      ...(link.externalUrl ? { isExternal: true } : {}),
    });
  }
  return items;
}

/**
 * Solr does not store nav permissions. Documents share their id with the local legacy index
 * (`hcc-module-<href>-<id>`, both produced by chrome-service), so evaluate the permissions that
 * were loaded with the local index. Documents without known permissions are visible, as locally.
 */
async function filterVisible(items: SearchResultItem[], env: ReleaseEnv) {
  const checks = await Promise.all(items.map(({ id }) => checkResultPermissions(id, env)));
  const results = items.filter((_item, index) => !checks[index].hidden).slice(0, HYDRA_SEARCH_MAX_RESULTS);
  return { results, visibilityFailed: checks.some(({ failed }) => failed) };
}

const resultCache = new Map<string, SearchResultItem[]>();

export function clearHydraSearchCache() {
  resultCache.clear();
}

/**
 * Query the Hydra console search endpoint. Throws HydraSearchError on timeout, HTTP, network or
 * payload errors. Rethrows the caller's AbortError.
 */
export async function hydraQuery(
  term: string,
  { env = ReleaseEnv.STABLE, signal }: { env?: ReleaseEnv; signal?: AbortSignal } = {}
): Promise<SearchResultItem[]> {
  if (term.trim().length === 0) {
    return [];
  }
  const url = buildHydraSearchUrl(term);
  const cacheKey = `${env}-${url.toString()}`;
  const cached = resultCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, HYDRA_SEARCH_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);
  if (signal?.aborted) {
    controller.abort();
  }

  let data: unknown;
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'omit',
      headers: { Accept: 'application/json', 'X-User-Agent': getClientIdentity() },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new HydraSearchError(`Hydra search responded with ${response.status}`, 'http');
    }
    try {
      data = await response.json();
    } catch {
      throw new HydraSearchError('Hydra search returned a non-JSON payload', 'invalid-response');
    }
  } catch (error) {
    if (error instanceof HydraSearchError) {
      throw error;
    }
    if (timedOut) {
      throw new HydraSearchError(`Hydra search timed out after ${HYDRA_SEARCH_TIMEOUT_MS}ms`, 'timeout');
    }
    if (signal?.aborted) {
      throw error;
    }
    throw new HydraSearchError(`Hydra search request failed: ${error instanceof Error ? error.message : String(error)}`, 'network');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  if (!isHydraSearchResponse(data)) {
    throw new HydraSearchError('Hydra search returned an unexpected payload', 'invalid-response');
  }

  const { results, visibilityFailed } = await filterVisible(mapHydraResponse(term, data), env);
  // Do not make a partial result caused by visibility errors permanent.
  if (!visibilityFailed) {
    if (resultCache.size >= RESULT_CACHE_LIMIT) {
      const oldest = resultCache.keys().next().value;
      if (oldest !== undefined) {
        resultCache.delete(oldest);
      }
    }
    resultCache.set(cacheKey, results);
  }
  return results;
}
