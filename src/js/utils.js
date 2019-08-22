import get from 'lodash/get';

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
        pathname.indexOf('/openshift') === 0 ||
        pathname.indexOf('/beta/openshift') === 0) {
        return true;
    }

    return false;
}

export function pageRequiresAuthentication() {
    const section = getSection();
    if (section === 'insights' ||
        section === 'rhel'     ||
        section === 'hybrid'   ||
        section === 'apps'     ||
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
