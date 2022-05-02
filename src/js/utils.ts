import get from 'lodash/get';
import { Store } from 'redux';
import { DEFAULT_ROUTES } from './jwt/constants';
import flatMap from 'lodash/flatMap';
import { NavItem } from './types';

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
    pathname === '/beta' ||
    pathname === '/beta/' ||
    pathname.indexOf('/openshift') === 0 ||
    pathname.indexOf('/beta/openshift') === 0 ||
    pathname.indexOf('/security') === 0 ||
    pathname.indexOf('/beta/security') === 0 ||
    pathname.indexOf('/application-services') === 0 ||
    pathname.indexOf('/beta/application-services') === 0 ||
    pathname.indexOf('/hac') === 0 ||
    pathname.indexOf('/beta/hac') === 0 ||
    pathname.indexOf('/ansible/ansible-dashboard/trial') === 0 ||
    pathname.indexOf('/beta/ansible/ansible-dashboard/trial') === 0
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

/**
 * Creates a redux listener that watches the state on given path (e.g. chrome.appNav) and calls
 * the given function when the state on the given path changes.
 *
 * The function is called with two parameters: current state value on the path, store reference
 */
export function createReduxListener(store: Store, path: string, fn: (current: any, store: Store) => void) {
  let previous: any = undefined;

  return () => {
    const state = store.getState();
    const current = get(state, path);

    if (current !== previous) {
      previous = current;
      fn(current, store);
    }
  };
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

export const isAnsible = (sections: string[]) => (sections.includes('ansible') && sections.includes('insights') ? 1 : 0);

export function getUrl(type?: string) {
  if (window.location.pathname === '/beta/' || window.location.pathname === '/') {
    return 'landing';
  }

  const sections = window.location.pathname.split('/');
  if (sections[1] === 'beta') {
    return type === 'bundle' ? sections[2] : sections[3 + isAnsible(sections)];
  }

  return type === 'bundle' ? sections[1] : sections[2 + isAnsible(sections)];
}

export function getEnv() {
  return Object.entries(DEFAULT_ROUTES).find(([, { url }]) => url.includes(location.hostname))?.[0] || 'qa';
}

export function getEnvDetails() {
  return Object.entries(DEFAULT_ROUTES).find(([, { url }]) => url.includes(location.hostname))?.[1];
}

export function isBeta() {
  return window.location.pathname.split('/')[1] === 'beta' ? true : false;
}

export function isFedRamp() {
  return getEnv() === 'gov';
}

export function updateDocumentTitle(title?: string) {
  if (typeof title === 'undefined') {
    return;
  }
  if (typeof title === 'string') {
    document.title = title;
  } else {
    console.warn(`Title is not a string. Got ${typeof title} instead.`);
  }
}

const activateChild = (hrefMatch: string, childRoutes: NavItem[]) => {
  let hasActiveChild = false;
  const routes = childRoutes.map((item) => {
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
