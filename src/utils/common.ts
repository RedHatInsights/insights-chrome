import flatMap from 'lodash/flatMap';
import { ChromeModule, NavItem, RouteDefinition } from '../@types/types';
import axios from 'axios';
import { Required } from 'utility-types';
import useBundle, { getUrl } from '../hooks/useBundle';

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
  routes: NavItem[];
} => {
  let hasActiveChild = false;
  const routes = childRoutes.map((item) => {
    // If expandable traverse children again
    if (item.expandable) {
      const nestedResult = activateChild(hrefMatch, item.routes || []);
      // mark active if nested child is active
      if (nestedResult.active) {
        hasActiveChild = true;
      }
      return {
        ...item,
        active: nestedResult.active,
        routes: nestedResult.routes,
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
    routes,
  };
};

function mutateSchema(hrefMatch: string, navItems: NavItem[]): NavItem[] {
  return navItems.map((item) => {
    const { href, routes, navItems } = item;
    if (!href && navItems) {
      return {
        ...item,
        navItems: mutateSchema(hrefMatch, navItems),
      };
    }

    if (!href && routes) {
      return {
        ...item,
        ...activateChild(hrefMatch, routes),
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
  return flatMap<NavItem, string>(navItems, ({ href, routes, navItems }) => {
    if (!href && navItems) {
      return levelArray(navItems);
    }

    if (!href && routes) {
      return levelArray(routes);
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

// FIXME: Remove once qaprodauth is dealt with
// can't use /beta because it will ge redirected by Akamai to /preview and we don't have any assets there\\
// Always use stable
const loadCSCFedModules = () =>
  axios.get(`${window.location.origin}/config/chrome/fed-modules.json?ts=${Date.now()}`, {
    headers: fedModulesheaders,
  });

export const loadFedModules = async () => {
  const fedModulesPath = '/api/chrome-service/v1/static/fed-modules-generated.json';
  return Promise.all([
    axios
      .get(fedModulesPath, {
        headers: fedModulesheaders,
      })
      .catch(loadCSCFedModules),
    axios.get(getChromeDynamicPaths()).catch(() => ({ data: {} })),
  ]).then(([staticConfig, feoConfig]) => {
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

export function isExpandableNav(item: NavItem): item is Required<NavItem, 'routes'> {
  return !!item.expandable;
}

function isActiveLeaf(item: NavItem | undefined): boolean {
  return typeof item?.href === 'string' && item?.active === true;
}

export function findNavLeafPath(
  navItems: (NavItem | undefined)[],
  matcher = isActiveLeaf
): { activeItem: Required<NavItem, 'href'> | undefined; navItems: NavItem[] } {
  let leaf: Required<NavItem, 'href'> | undefined;
  // store the parent nodes
  const leafPath: NavItem[] = [];
  let index = 0;
  while (leaf === undefined && index < navItems.length) {
    const item = navItems[index];
    index += 1;
    if (item && isExpandableNav(item)) {
      const { activeItem, navItems } = findNavLeafPath(item.routes, matcher) || {};
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
