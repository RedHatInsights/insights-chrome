import get from 'lodash/get';
import { setupCache } from 'axios-cache-adapter';
import { createCacheStore } from './utils/cache';
import { DEFAULT_ROUTES } from './jwt/constants';

export function getWindow() {
  return window;
}

/* eslint-disable curly */
export function isValidAccountNumber(num) {
  if (!num) return false;
  if (num === -1) return false;
  if (num === '-1') return false;
  return Number.isInteger(Number(num));
}
/* eslint-enable curly */

function getSection() {
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
    pathname.indexOf('/beta/application-services') === 0
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
export function createReduxListener(store, path, fn) {
  let previous = undefined;

  return () => {
    const state = store.getState();
    const current = get(state, path);

    if (current !== previous) {
      previous = current;
      fn(current, store);
    }
  };
}

export function deleteLocalStorageItems(keys) {
  keys.map((key) => localStorage.removeItem(key));
}

export function lastActive(searchString, fallback) {
  return Object.keys(localStorage).reduce((acc, curr) => {
    if (curr.includes(searchString)) {
      try {
        let accDate;
        try {
          accDate = new Date(JSON.parse(localStorage.getItem(acc).expires));
        } catch {
          accDate = new Date();
        }

        const currObj = JSON.parse(localStorage.getItem(curr));
        return accDate >= new Date(currObj.expires) ? acc : curr;
      } catch (e) {
        return acc;
      }
    }

    return acc;
  }, fallback);
}

export function bootstrapCache(endpoint, cacheKey) {
  const store = createCacheStore(endpoint, cacheKey);
  return setupCache({
    store,
    maxAge: 10 * 60 * 1000, // 10 minutes
  });
}

export const isAnsible = (sections) => sections.includes('ansible') && sections.includes('insights');

export function getUrl(type) {
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
  return getEnv() === 'gov' || getEnv() === 'govStage';
}

export function updateDocumentTitle(title) {
  if (typeof title === 'undefined') {
    return;
  }
  if (typeof title === 'string') {
    document.title = title;
  } else {
    console.warn(`Title is not a string. Got ${typeof title} instead.`);
  }
}
