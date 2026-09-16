import flatMap from 'lodash/flatMap';
import { ChromeModule, NavItem, RouteDefinition } from '../@types/types';
import axios from 'axios';
import { Required } from 'utility-types';
import { setupCache } from 'axios-cache-interceptor';
import useBundle, { getUrl } from '../hooks/useBundle';
import { cacheFetch } from './cacheFetch';
import * as Sentry from '@sentry/react';

/**
 * Base path for the Lightwell route.
 * Used in ScalprumRoot.tsx (route definition) and Tools.tsx (pathname check).
 */
export const LIGHTWELL_PATH = '/lightwell';

export const DEFAULT_SSO_ROUTES = {
  prod: {
    url: ['access.redhat.com', 'prod.foo.redhat.com', 'cloud.redhat.com', 'console.redhat.com', 'us.console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  qa: {
    url: ['qa.foo.redhat.com', 'qa.cloud.redhat.com', 'qa.console.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
    portal: 'https://access.qa.redhat.com',
  },
  ci: {
    url: ['ci.foo.redhat.com', 'ci.cloud.redhat.com', 'ci.console.redhat.com'],
    sso: 'https://sso.qa.redhat.com/auth',
    portal: 'https://access.qa.redhat.com',
  },
  qaprodauth: {
    url: ['qaprodauth.foo.redhat.com', 'qaprodauth.cloud.redhat.com', 'qaprodauth.console.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
  stage: {
    url: ['stage.foo.redhat.com', 'cloud.stage.redhat.com', 'console.stage.redhat.com', 'fetest.stage.redhat.com', 'us.console.stage.redhat.com'],
    sso: 'https://sso.stage.redhat.com/auth',
    portal: 'https://access.stage.redhat.com',
  },
  frhStage: {
    url: ['console.stage.openshiftusgov.com'],
    sso: 'https://sso.stage.openshiftusgov.com',
    portal: 'https://console.stage.openshiftusgov.com',
  },
  frh: {
    url: ['console.openshiftusgov.com'],
    sso: 'https://sso.openshiftusgov.com',
    portal: 'https://console.openshiftusgov.com',
  },
  ephem: {
    url: ['ephem.outsrights.cc'],
    sso: 'https://keycloak-fips-test.apps.fips-key.2vn8.p1.openshiftapps.com',
    portal: 'https://ephem.outsrights.cc/',
  },
  int: {
    url: ['console.int.openshiftusgov.com'],
    sso: 'https://sso.int.openshiftusgov.com/',
    portal: 'https://console.int.openshiftusgov.com/',
  },
  scr: {
    url: ['console01.stage.openshiftusgov.com'],
    sso: 'https://sso01.stage.openshiftusgov.com/',
    portal: 'https://console01.stage.openshiftusgov.com',
  },
  dev: {
    url: ['dev.foo.redhat.com', 'console.dev.redhat.com', 'us.console.dev.redhat.com'],
    sso: 'https://sso.redhat.com/auth',
    portal: 'https://access.redhat.com',
  },
};

export const LOGIN_SCOPES_STORAGE_KEY = '@chrome/login-scopes';
export const chunkLoadErrorRefreshKey = 'ChunkLoadErrorRefreshed';
export const BLOCK_CLEAR_GATEWAY_ERROR = 'BLOCK_CLEAR_GATEWAY_ERROR';

/**
 * Extracts a message string from an unknown error value.
 * @param error - The error value to extract a message from
 * @param fallback - Optional fallback message (default: 'Unhandled UI runtime error')
 * @returns A human-readable error message string
 */
export function getErrorMessage(error: unknown, fallback = 'Unhandled UI runtime error'): string {
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}

export function getWindow() {
  return window;
}

export function isValidAccountNumber(num?: number | string) {
  if (!num) return false;
  if (num === -1) return false;
  if (num === '-1') return false;
  return Number.isInteger(Number(num));
}

export function getSection() {
  const sections = getWindow().location.pathname.split('/');
  if (sections[1] === 'beta') {
    return sections[2] || '';
  }

  return sections[1];
}

export function pageAllowsUnentitled() {
  const pathname = getWindow().location.pathname;
  if (
    pathname === '/' ||
    pathname.indexOf('/openshift') === 0 ||
    pathname.indexOf('/beta/openshift') === 0 ||
    pathname.indexOf('/security') === 0 ||
    pathname.indexOf('/beta/security') === 0 ||
    pathname.indexOf('/application-services') === 0 ||
    pathname.indexOf('/beta/application-services') === 0 ||
    pathname.indexOf('/hac') === 0 ||
    pathname.indexOf('/beta/hac') === 0 ||
    pathname.indexOf('/ansible/ansible-dashboard/trial') === 0 ||
    pathname.indexOf('/beta/ansible/ansible-dashboard/trial') === 0 ||
    // allow tenants with no account numbers: RHCLOUD-21396
    pathname.match(/\/connect\//)
  ) {
    return true;
  }

  return false;
}

export function pageRequiresAuthentication() {
  const section = getSection();
  if (
    section === 'insights' ||
    section === 'cost-management' ||
    section === 'apps' ||
    section === 'ansible' ||
    section === 'migrations' ||
    section === 'subscriptions' ||
    section === 'openshift' ||
    section === 'settings' ||
    section === 'user-preferences' ||
    section === 'internal' ||
    section === 'application-services'
  ) {
    return true;
  }

  return false;
}

export function deleteLocalStorageItems(keys: string[]) {
  keys.map((key) => localStorage.removeItem(key));
}

export function lastActive(searchString: string, fallback: string) {
  return Object.keys(localStorage).reduce<string | { expires: string }>((acc, curr) => {
    if (curr.includes(searchString)) {
      try {
        let accDate;
        try {
          const localStorageDate = localStorage.getItem(acc as string);
          accDate = localStorageDate ? new Date(JSON.parse(localStorageDate)?.expires) : new Date();
        } catch {
          accDate = new Date();
        }

        const currObj = JSON.parse(localStorage.getItem(curr) || '');
        return accDate >= new Date(currObj.expires) ? acc : curr;
      } catch (e) {
        return acc;
      }
    }

    return acc;
  }, fallback);
}

export function getEnv() {
  return Object.entries(DEFAULT_SSO_ROUTES).find(([, { url }]) => url.includes(location.hostname))?.[0] || 'qa';
}

export function getEnvDetails() {
  return Object.entries(DEFAULT_SSO_ROUTES).find(([, { url }]) => url.includes(location.hostname))?.[1];
}

export function isProd() {
  return location.host === 'cloud.redhat.com' || location.host === 'console.redhat.com' || location.host.includes('prod.foo.redhat.com');
}

export function ITLess() {
  return getEnv() === 'frhStage' || getEnv() === 'frh' || getEnv() === 'ephem' || getEnv() === 'int' || getEnv() === 'scr';
}

export function ITLessCognito() {
  return getEnv() === 'ephem';
}

export function updateDocumentTitle(title?: string, noSuffix = false) {
  const titleSuffix = `| ${useBundle().bundleTitle}`;
  if (typeof title === 'undefined') {
    return;
  }
  if (typeof title === 'string') {
    document.title = title.includes(titleSuffix) || noSuffix ? title : `${title} ${titleSuffix}`;
  } else {
    console.warn(`Title is not a string. Got ${typeof title} instead.`);
  }
}

const activateChild = (
  hrefMatch: string,
  childRoutes: NavItem[]
): {
  active: boolean;
  navItems: NavItem[];
} => {
  let hasActiveChild = false;
  const navItems = childRoutes.map((item) => {
    // If expandable traverse children again
    if (item.expandable) {
      const nestedResult = activateChild(hrefMatch, item.navItems || []);
      // mark active if nested child is active
      if (nestedResult.active) {
        hasActiveChild = true;
      }
      return {
        ...item,
        active: nestedResult.active,
        navItems: nestedResult.navItems,
      };
    }
    const active = item.href === hrefMatch;
    if (active) {
      hasActiveChild = true;
    }
    return {
      ...item,
      active,
    };
  });
  return {
    active: hasActiveChild,
    navItems,
  };
};

function mutateSchema(hrefMatch: string, navItems: NavItem[]): NavItem[] {
  return navItems.map((item) => {
    const { href, navItems } = item;
    if (!href && navItems) {
      if (item.expandable) {
        return {
          ...item,
          ...activateChild(hrefMatch, navItems),
        };
      }
      return {
        ...item,
        navItems: mutateSchema(hrefMatch, navItems),
      };
    }

    if (href) {
      return {
        ...item,
        active: item.href === hrefMatch,
      };
    }

    return item;
  });
}

export const highlightItems = (pathname: string, navItems: NavItem[], sortedLinks: string[]) => {
  const cleanPathname = pathname.replace(/\/$/, '');
  const segmentsCount = cleanPathname.split('/').length + 1;
  const matchedLink = sortedLinks.find((href) => {
    const segmentedHref = href.replace(/\/$/, '').split('/').slice(0, segmentsCount).join('/');
    return cleanPathname.includes(segmentedHref);
  });
  return mutateSchema(matchedLink?.replace(/\/$/, '') || '', navItems);
};

export const levelArray = (navItems: NavItem[]): string[] => {
  return flatMap<NavItem, string>(navItems, ({ href, navItems }) => {
    if (!href && navItems) {
      return levelArray(navItems);
    }

    if (href) {
      return [href];
    }

    return [];
  });
};

export function noop() {}

export const trustarcScriptSetup = () => {
  const trustarcScript = document.createElement('script');
  trustarcScript.id = 'trustarc';

  if (location.host === 'console.redhat.com') {
    trustarcScript.src = '//static.redhat.com/libs/redhat/marketing/latest/trustarc/trustarc.js';
  } else {
    trustarcScript.src = '//static.dev.redhat.com/libs/redhat/marketing/latest/trustarc/trustarc.js';
    trustarcScript.setAttribute('data-domain', 'redhat_test.com');
  }

  document.body.appendChild(trustarcScript);
};

const CHROME_SERVICE_BASE = '/api/chrome-service/v1';
export const chromeServiceStaticPathname: { [key in CPN]: { stage: string; prod: string; itless: string } } = {
  stable: {
    stage: '/static/stable/stage',
    prod: '/static/stable/prod',
    itless: '/static/stable/itless',
  },
};

type CPN = 'stable';

export function getChromeStaticPathname(type: 'modules' | 'navigation' | 'services' | 'search') {
  const stableEnv: CPN = 'stable';
  const prodEnv = isProd() ? 'prod' : ITLess() ? 'itless' : 'stage';
  return `${CHROME_SERVICE_BASE}${chromeServiceStaticPathname[stableEnv][prodEnv]}/${type}`;
}

function getChromeDynamicPaths() {
  return '/apps/chrome/operator-generated/fed-modules.json';
}

const fedModulesheaders = {
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  Expires: '0',
};

let ssoConfigAxiosInstance: ReturnType<typeof setupCache> | undefined;
function getSSOConfigAxios() {
  if (!ssoConfigAxiosInstance) {
    ssoConfigAxiosInstance = setupCache(axios.create(), {
      ttl: 5 * 60 * 1000, // 5 minutes TTL
      interpretHeader: false, // Ignore server cache headers for consistent client-side caching
    });
  }
  return ssoConfigAxiosInstance;
}

// Add trailing slash if missing
function sanitizeSsoUrl(url: string) {
  return `${url.replace(/\/$/, '')}/`;
}

export interface SSOConfig {
  ssoUrl: string;
  ssoMapping: Record<string, string>;
}

// Resolve SSO URL based on current hostname and operator config
export const resolveSSOUrl = (ssoConfig: SSOConfig): string => {
  if (!ssoConfig?.ssoUrl) {
    // Default to stage SSO — safer than production for unrecognized environments
    // (e.g. local dev on non-standard hosts)
    return 'https://sso.stage.redhat.com/auth/';
  }

  const currentHostname = location.hostname;

  // Check if current hostname has a specific mapping
  if (ssoConfig.ssoMapping && typeof ssoConfig.ssoMapping === 'object') {
    // Try exact match first
    const directMatch = ssoConfig.ssoMapping[currentHostname];
    if (directMatch) {
      return sanitizeSsoUrl(directMatch);
    }

    // Fall back to partial matching, sorted by pattern length descending
    // so more specific patterns (e.g. "qa.cloud.redhat.com") match before
    // broader ones (e.g. "cloud.redhat.com")
    const sortedEntries = Object.entries(ssoConfig.ssoMapping).sort(([a], [b]) => b.length - a.length);
    for (const [pattern, ssoUrl] of sortedEntries) {
      if (currentHostname.includes(pattern)) {
        return sanitizeSsoUrl(ssoUrl);
      }
    }
  }

  // Return default SSO URL
  return sanitizeSsoUrl(ssoConfig.ssoUrl);
};

// Runtime validator for SSOConfig shape
function isSSOConfig(data: unknown): data is SSOConfig {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('ssoUrl' in data) ||
    typeof (data as SSOConfig).ssoUrl !== 'string' ||
    (data as SSOConfig).ssoUrl.length === 0 ||
    !('ssoMapping' in data) ||
    typeof (data as SSOConfig).ssoMapping !== 'object' ||
    (data as SSOConfig).ssoMapping === null ||
    Array.isArray((data as SSOConfig).ssoMapping)
  ) {
    return false;
  }

  // Validate that all ssoMapping values are nonempty strings
  const mapping = (data as SSOConfig).ssoMapping;
  return Object.values(mapping).every((value) => typeof value === 'string' && value.length > 0);
}

// Load SSO configuration from operator-generated config with automatic caching
export const loadSSOConfig = async (): Promise<SSOConfig> => {
  const ssoConfigPath = '/api/chrome-service/v1/static/sso-config-generated.json';
  try {
    const { data, fromCache } = await cacheFetch(
      'sso-config-generated',
      () =>
        getSSOConfigAxios()
          .get<SSOConfig>(ssoConfigPath, { headers: fedModulesheaders })
          .then((r) => {
            if (!isSSOConfig(r.data)) {
              throw new Error('SSO config validation failed: invalid shape or mapping values');
            }
            return r.data;
          }),
      undefined,
      isSSOConfig
    );
    if (fromCache) {
      console.warn('[chrome] SSO config loaded from IndexedDB cache (origin unavailable)');
    }
    return data;
  } catch (error) {
    console.warn('Unable to load SSO config from operator, using default fallback', error);

    // Create fallback SSO config from DEFAULT_SSO_ROUTES
    const currentEnvDetails = getEnvDetails();

    // Build ssoMapping from all environments in DEFAULT_SSO_ROUTES
    const ssoMapping: Record<string, string> = {};
    Object.entries(DEFAULT_SSO_ROUTES).forEach(([, config]) => {
      config.url.forEach((hostname) => {
        ssoMapping[hostname] = config.sso;
      });
    });

    return {
      ssoUrl: currentEnvDetails?.sso || 'https://sso.stage.redhat.com/auth/',
      ssoMapping,
    };
  }
};

// Validate a single fed-modules entry (one app). Returns a human-readable
// reason when invalid, or null when the entry is a usable ChromeModule. The
// checks mirror exactly what generateRoutesList consumes so a passing entry can
// never crash route generation at bootstrap.
function getFedModuleEntryError(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) {
    return 'entry is not an object';
  }

  const module = value as Record<string, unknown>;
  if (!('manifestLocation' in module) || typeof module.manifestLocation !== 'string') {
    return 'missing string manifestLocation';
  }

  // The optional `modules` array is consumed by generateRoutesList, which maps
  // over each RemoteModule's `routes`. Reject malformed shapes here.
  if ('modules' in module && module.modules !== undefined) {
    if (!Array.isArray(module.modules)) {
      return 'modules is not an array';
    }
    for (const remote of module.modules) {
      if (typeof remote !== 'object' || remote === null) {
        return 'modules[] contains a non-object entry';
      }
      const remoteModule = remote as Record<string, unknown>;
      if (typeof remoteModule.module !== 'string' || !Array.isArray(remoteModule.routes)) {
        return 'RemoteModule missing string `module` or array `routes`';
      }
      // Each route is either a plain string or an object with a string pathname.
      for (const route of remoteModule.routes) {
        const validRoute =
          typeof route === 'string' || (typeof route === 'object' && route !== null && typeof (route as Record<string, unknown>).pathname === 'string');
        if (!validRoute) {
          return 'routes[] entry is not a string or object with string pathname';
        }
      }
    }
  }

  return null;
}

// Runtime validator for the whole federated modules map. Used as the cache-read
// guard: cached data is written already-sanitized, so it must validate as a whole.
export function isFedModulesConfig(data: unknown): data is { [key: string]: ChromeModule } {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  // Reject arrays — fed-modules config must be a plain object map
  if (Array.isArray(data)) {
    return false;
  }

  // $schema is optional metadata; every other entry must be a valid ChromeModule
  return Object.entries(data).every(([key, value]) => key === '$schema' || getFedModuleEntryError(value) === null);
}

// Sanitize a live fed-modules response: drop individual malformed entries
// (logging + reporting each) instead of discarding the entire map, so one bad
// app cannot take down the whole console. Throws only when the top-level shape
// is unusable (not an object map) or when every entry is invalid — those cases
// fall through to the CSC/IndexedDB fallback chain.
export function sanitizeFedModules(data: unknown, source: string): { [key: string]: ChromeModule } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`[chrome] ${source} fed-modules response is not a valid module map`);
  }

  const entries = Object.entries(data);
  const sanitized: { [key: string]: ChromeModule } = {};
  const dropped: string[] = [];
  let moduleEntryCount = 0;

  for (const [key, value] of entries) {
    if (key === '$schema') {
      sanitized[key] = value as ChromeModule;
      continue;
    }
    moduleEntryCount += 1;
    const error = getFedModuleEntryError(value);
    if (error) {
      dropped.push(`${key} (${error})`);
      continue;
    }
    sanitized[key] = value as ChromeModule;
  }

  if (dropped.length > 0) {
    const message = `[chrome] ${source} fed-modules: dropped ${dropped.length} malformed module(s): ${dropped.join(', ')}`;
    console.warn(message);
    // Surface bad config in monitoring instead of silently dropping it. Safe to
    // call before Sentry.init (no-op when uninitialized).
    Sentry.captureException(new Error(message), { level: 'warning', tags: { area: 'fed-modules', source } });
  }

  // If there were module entries but none survived, treat it as a failed
  // response so the fallback chain (CSC → IndexedDB) can take over.
  if (moduleEntryCount > 0 && Object.keys(sanitized).every((key) => key === '$schema')) {
    throw new Error(`[chrome] ${source} fed-modules response has no valid modules`);
  }

  return sanitized;
}

// FIXME: Remove once qaprodauth is dealt with
// can't use /beta because it will ge redirected by Akamai to /preview and we don't have any assets there\\
// Always use stable
const loadCSCFedModules = () =>
  axios.get<{ [key: string]: ChromeModule }>(`${window.location.origin}/config/chrome/fed-modules.json?ts=${Date.now()}`, {
    headers: fedModulesheaders,
  });

export const loadFedModules = async () => {
  const fedModulesPath = '/api/chrome-service/v1/static/fed-modules-generated.json';

  // Try chrome-service, then live CSC. IndexedDB is only used after both fail.
  // Each response is sanitized: individually malformed apps are dropped (and
  // reported) so one bad entry cannot break the whole console; a wholly unusable
  // response throws so the next fallback takes over.
  const fetchLiveFedModules = async (): Promise<{ [key: string]: ChromeModule }> => {
    try {
      const { data } = await axios.get<unknown>(fedModulesPath, { headers: fedModulesheaders });
      return sanitizeFedModules(data, 'Chrome Service');
    } catch (err) {
      // Log the original error only if it came from our validation; network
      // errors are expected and will be visible in the fallback path.
      if (err instanceof Error && err.message.includes('fed-modules')) {
        console.warn(err.message);
      }
      const { data } = await loadCSCFedModules();
      return sanitizeFedModules(data, 'CSC');
    }
  };

  const staticConfigPromise = cacheFetch('fed-modules-generated', fetchLiveFedModules, undefined, isFedModulesConfig).then(({ data, fromCache }) => {
    if (fromCache) {
      console.warn('[chrome] Fed modules loaded from IndexedDB cache (origin unavailable)');
    }
    return { data };
  });

  const dynamicPathsPromise = axios.get(getChromeDynamicPaths()).catch(() => ({ data: {} }));
  return Promise.all([staticConfigPromise, dynamicPathsPromise]).then(([staticConfig, feoConfig]) => {
    if (feoConfig?.data?.chrome) {
      staticConfig.data.chrome = feoConfig?.data?.chrome;
    }
    return staticConfig;
  });
};

export const generateRoutesList = (modules: { [key: string]: ChromeModule }) =>
  Object.entries(modules)
    .reduce<RouteDefinition[]>(
      (acc, [scope, { dynamic, manifestLocation, modules = [] }]) => [
        ...acc,
        ...modules
          .map(({ module, routes }) =>
            /**Clean up this map function */
            routes.map((route) => ({
              scope,
              module,
              path: typeof route === 'string' ? route : route.pathname,
              manifestLocation,
              dynamic: typeof dynamic === 'boolean' ? dynamic : typeof route === 'string' ? true : route.dynamic,
              exact: typeof route === 'string' ? false : route.exact,
              props: typeof route === 'object' ? route.props : undefined,
              permissions: typeof route === 'object' ? route.permissions : undefined,
            }))
          )
          .flat(),
      ],
      []
    )
    .sort((a, b) => (a.path.length < b.path.length ? 1 : -1));

export const isGlobalFilterAllowed = () => {
  if (getUrl('bundle') === 'insights') {
    return true;
  }

  return getUrl('bundle') === 'ansible' && ['inventory', 'drift', 'advisor'].includes(getUrl('app'));
};

export function isExpandableNav(item: NavItem): item is Required<NavItem, 'navItems'> {
  return !!item.expandable && Array.isArray(item.navItems);
}

function isActiveLeaf(item: NavItem | undefined): boolean {
  return typeof item?.href === 'string' && item?.active === true;
}

export function findNavLeafPath(
  navItems: (NavItem | undefined)[],
  matcher = isActiveLeaf
): { activeItem: Required<NavItem, 'href'> | undefined; navItems: NavItem[] } {
  if (!Array.isArray(navItems)) {
    return { activeItem: undefined, navItems: [] };
  }
  let leaf: Required<NavItem, 'href'> | undefined;
  // store the parent nodes
  const leafPath: NavItem[] = [];
  let index = 0;
  while (leaf === undefined && index < navItems.length) {
    const item = navItems[index];
    index += 1;
    if (item && isExpandableNav(item)) {
      const { activeItem, navItems } = findNavLeafPath(item.navItems, matcher) || {};
      if (activeItem) {
        leaf = activeItem;
        // append parent nodes of an active item
        leafPath.push(item, ...navItems);
      }
    } else if (matcher(item) && item?.href) {
      leaf = item as Required<NavItem, 'href'>;
    }
  }

  return { activeItem: leaf, navItems: leafPath };
}

// converts text to an identifier in title case
export const titleToId = (title: string) => title?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/\s+/g, '');

export function getSevenDaysAgo(): string {
  const today = new Date();
  const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
  return sevenDaysAgo.toISOString().split('.')[0];
}
