import { getCachedModule, getModule, preloadModule } from '@scalprum/core';
import { useModule } from '@scalprum/react-core';
import { useEffect, useState } from 'react';
// Type-only import — erased at build time, so it creates NO webpack module edge
// from the host graph to the exposed store. Chrome consumes the store ONLY via
// the Module Federation remote path below, guaranteeing a single store factory.
import type { DarkModeStore } from '../state/stores/darkModeStore';

const SCOPE = 'chrome';
const MODULE = './theme/useDarkModeStore';
const IMPORT_NAME = 'getDarkModeStore';

type GetDarkModeStore = () => DarkModeStore;

let storePromise: Promise<DarkModeStore> | null = null;

/**
 * Load the dark mode store through the `chrome` federated remote (self-consumption).
 * Memoized so every caller shares the same resolved singleton. On failure the memo
 * is cleared so a later call can retry.
 */
export const loadDarkModeStore = (): Promise<DarkModeStore> => {
  if (!storePromise) {
    storePromise = getModule<GetDarkModeStore>(SCOPE, MODULE, IMPORT_NAME)
      .then((getStore) => getStore())
      .catch((error) => {
        storePromise = null;
        throw error;
      });
  }
  return storePromise;
};

/** Synchronously return the store if the module is already loaded, otherwise undefined. */
export const getCachedDarkModeStore = (): DarkModeStore | undefined => {
  const getStore = getCachedModule<GetDarkModeStore>(SCOPE, MODULE).cachedModule?.[IMPORT_NAME];
  return typeof getStore === 'function' ? getStore() : undefined;
};

/** Warm the `chrome#./theme/useDarkModeStore` module so later reads resolve immediately. */
export const preloadDarkModeStore = (): Promise<unknown> => preloadModule(SCOPE, MODULE);

/**
 * React hook returning the dark mode store, or undefined until it resolves.
 * Seeds from the cached module so a warmed store is available on first render.
 */
export const useDarkModeStoreRef = (): DarkModeStore | undefined => {
  const cachedGetter = getCachedModule<GetDarkModeStore>(SCOPE, MODULE).cachedModule?.[IMPORT_NAME];
  const getStore = useModule<GetDarkModeStore>(SCOPE, MODULE, cachedGetter, IMPORT_NAME);
  return typeof getStore === 'function' ? getStore() : undefined;
};

/**
 * React hook for Chrome-internal components to read dark mode state reactively.
 * Uses MF self-consumption (no static value-import of the store module).
 * Falls back to the DOM class if the store isn't warmed yet.
 */
export const useDarkModeIsDark = (): boolean => {
  const store = useDarkModeStoreRef();

  const [isDark, setIsDark] = useState(() =>
    store ? store.getState().isDark : typeof document !== 'undefined' && document.documentElement.classList.contains('pf-v6-theme-dark')
  );

  useEffect(() => {
    if (!store) return;
    // Sync current state (may have changed since initial render)
    setIsDark(store.getState().isDark);
    return store.subscribeAll(() => {
      setIsDark(store.getState().isDark);
    });
  }, [store]);

  return isDark;
};

/** @internal Reset the memoized store promise. For testing only. */
export const _resetDarkModeStoreBridge = () => {
  storePromise = null;
};
