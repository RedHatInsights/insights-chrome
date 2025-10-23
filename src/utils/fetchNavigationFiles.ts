import axios from 'axios';
import { BundleNavigation, NavItem, Navigation } from '../@types/types';
import { Required } from 'utility-types';
import { itLessBundles, requiredBundles } from '../components/AppFilter/useAppFilter';
import { ITLess, getChromeStaticPathname } from './common';

export function isBundleNavigation(item: unknown): item is BundleNavigation {
  return typeof item !== 'undefined';
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
    // aggregate data call
    const { data: aggregateData } = await axios.get<BundleNavigation[]>('/api/chrome-service/v1/static/bundles-generated.json');
    const bundleNavigation = aggregateData.filter(isBundleNavigation);
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
    .then((data) => data.filter(isBundleNavigation))
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
