import axios from 'axios';
import { BundleNavigation, NavItem, Navigation } from '../@types/types';
import { Required } from 'utility-types';
import { itLessBundles, requiredBundles } from '../components/AppFilter/useAppFilter';
import { ITLess, getChromeStaticPathname } from './common';
import { cacheFetch } from './cacheFetch';
import { reportConfigSource } from './configCacheStatus';

type RawNavItem = Omit<NavItem, 'navItems'> & { routes?: RawNavItem[]; navItems?: RawNavItem[] };

function normalizeNavItem(item: RawNavItem): NavItem {
  const { routes, navItems, ...rest } = item;
  const children = navItems ?? routes;
  return {
    ...rest,
    ...(children ? { navItems: children.map(normalizeNavItem) } : {}),
  };
}

type RawBundleNavigation = Omit<BundleNavigation, 'navItems'> & { routes?: RawNavItem[]; navItems?: RawNavItem[] };

function normalizeBundle(bundle: RawBundleNavigation): BundleNavigation {
  const children = bundle.navItems ?? bundle.routes ?? [];
  return {
    ...bundle,
    navItems: children.map(normalizeNavItem),
  };
}

// Recursively validate a raw nav item so normalizeNavItem never destructures a
// non-object child. A single malformed descendant would otherwise throw and
// bypass the IndexedDB fallback, breaking navigation bootstrap.
function isValidRawNavItem(item: unknown): item is RawNavItem {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return false;
  }
  const node = item as RawNavItem;
  if (node.navItems !== undefined && (!Array.isArray(node.navItems) || !node.navItems.every(isValidRawNavItem))) {
    return false;
  }
  if (node.routes !== undefined && (!Array.isArray(node.routes) || !node.routes.every(isValidRawNavItem))) {
    return false;
  }
  return true;
}

export function isBundleNavigation(item: unknown): item is BundleNavigation {
  if (
    typeof item !== 'object' ||
    item === null ||
    !('id' in item) ||
    typeof (item as BundleNavigation).id !== 'string' ||
    !('title' in item) ||
    typeof (item as BundleNavigation).title !== 'string'
  ) {
    return false;
  }

  const hasNavItems = 'navItems' in item;
  const hasRoutes = 'routes' in item;

  // At least one navigation field must be present
  if (!hasNavItems && !hasRoutes) {
    return false;
  }

  // If navItems is present, it must be an array of valid nav items
  if (hasNavItems) {
    const navItems = (item as RawBundleNavigation).navItems;
    if (!Array.isArray(navItems) || !navItems.every(isValidRawNavItem)) {
      return false;
    }
  }

  // If routes is present, it must be an array of valid nav items
  if (hasRoutes) {
    const routes = (item as RawBundleNavigation).routes;
    if (!Array.isArray(routes) || !routes.every(isValidRawNavItem)) {
      return false;
    }
  }

  return true;
}

function isBundleNavigationArray(data: unknown): data is BundleNavigation[] {
  return Array.isArray(data) && data.length > 0 && data.every(isBundleNavigation);
}

export function isNavItems(navigation: Navigation | NavItem[]): navigation is Navigation {
  return Array.isArray((navigation as Navigation).navItems);
}

function isGroup(item: NavItem): item is Required<NavItem, 'groupId'> {
  return typeof item.groupId === 'string';
}

export function extractNavItemGroups(activeNavigation: Navigation | NavItem[]) {
  return (isNavItems(activeNavigation) ? activeNavigation.navItems.map((item) => (isGroup(item) ? item.navItems : item)) : activeNavigation)?.flat?.() || [];
}

const CACHE_TIMEOUT = 5 * 60_000; // 5 minutes cache window
// use simple memory cache to not fetch the data ll the time
const filesCache: {
  expires: number;
  data: BundleNavigation[];
  ready: boolean;
  existingRequest?: Promise<BundleNavigation[]>;
} = {
  expires: Date.now() + CACHE_TIMEOUT,
  data: [],
  ready: false,
  existingRequest: undefined,
};

const fetchNavigationFiles = async (feoGenerated = false) => {
  if (feoGenerated) {
    const { data: aggregateData, fromCache } = await cacheFetch(
      'bundles-generated',
      // Keep the raw live array so a partially malformed response fails the cache
      // guard and cannot replace the last-known-good snapshot. Valid live entries
      // are filtered only after cache admission has been decided.
      () =>
        axios.get<BundleNavigation[]>('/api/chrome-service/v1/static/bundles-generated.json').then((r) => {
          if (!Array.isArray(r.data)) {
            throw new Error('bundles-generated.json: expected array, received non-array payload');
          }
          if (r.data.filter(isBundleNavigation).length === 0) {
            throw new Error('bundles-generated.json: no usable navigation entries');
          }
          return r.data;
        }),
      undefined,
      isBundleNavigationArray
    );
    reportConfigSource('bundles-generated', fromCache);
    if (fromCache) {
      console.warn('[chrome] Bundle navigation loaded from IndexedDB cache (origin unavailable)');
    }
    // Cached data passed the payload guard; live data may be partial and is filtered here.
    const bundleNavigation = aggregateData.filter(isBundleNavigation).map(normalizeBundle);
    return bundleNavigation;
  }
  const bundles = ITLess() ? itLessBundles : requiredBundles;
  if (filesCache.ready && filesCache.expires > Date.now()) {
    return filesCache.data;
  }

  // do not fire multiple requests at the same time
  if (filesCache.existingRequest) {
    return filesCache.existingRequest;
  }

  filesCache.existingRequest = Promise.all(
    bundles.map((fragment) =>
      axios
        .get<BundleNavigation>(`${getChromeStaticPathname('navigation')}/${fragment}-navigation.json?ts=${Date.now()}`)
        .catch(() => {
          return axios.get<BundleNavigation>(`/config/chrome/${fragment}-navigation.json?ts=${Date.now()}`);
        })
        .then((response) => response.data)
        .catch((err) => {
          console.error('Unable to load bundle navigation', err, fragment);
          return [];
        })
    )
  )
    .then((data) => data.filter(isBundleNavigation).map(normalizeBundle))
    .then((data) => {
      filesCache.data = data;
      filesCache.ready = true;
      filesCache.expires = Date.now() + CACHE_TIMEOUT;
      filesCache.existingRequest = undefined;
      return data;
    });

  return filesCache.existingRequest;
};

export default fetchNavigationFiles;
