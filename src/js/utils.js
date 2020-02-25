import get from 'lodash/get';
import { setupCache } from 'axios-cache-adapter';
import localforage from 'localforage';

function getWindow() {
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
    if (sections[1] === 'beta') { return sections[2] || ''; }

    return sections[1];
}

export function pageAllowsUnentitled() {
    const pathname = getWindow().location.pathname;
    if (pathname === '/' ||
        pathname === '/beta' ||
        pathname === '/beta/' ||
        pathname.indexOf('/subscriptions') === 0 ||
        pathname.indexOf('/beta/subscriptions') === 0 ||
        pathname.indexOf('/openshift') === 0 ||
        pathname.indexOf('/beta/openshift') === 0) {
        return true;
    }

    return false;
}

export function pageRequiresAuthentication() {
    const section = getSection();
    if (section === 'insights'          ||
        section === 'rhel'              ||
        section === 'cost-management'   ||
        section === 'apps'              ||
        section === 'ansible'           ||
        section === 'subscriptions'     ||
        section === 'settings'          ||
        section === 'migrations') {
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
    keys.map(key => localStorage.removeItem(key));
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
                return (accDate >= new Date(currObj.expires)) ? acc : curr;
            } catch (e) {
                return acc;
            }
        }

        return acc;
    }, fallback);
}

export function bootstrapCache(endpoint, cacheKey) {
    const name = lastActive(endpoint, cacheKey);
    const store = localforage.createInstance({
        driver: [
            localforage.LOCALSTORAGE
        ],
        name: name.split('/')[0]
    });
    return setupCache({
        store,
        maxAge: 10 * 60 * 1000 // 10 minutes
    });
}
