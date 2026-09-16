import { getCachedModule, getModule, preloadModule } from '@scalprum/core';
import { useModule } from '@scalprum/react-core';
// Type-only import — erased at build time, so it creates NO webpack module edge
// from the host graph to the exposed store. Chrome consumes the store ONLY via
// the Module Federation remote path below, guaranteeing a single store factory.
import type { BreadcrumbStore } from '../state/stores/breadcrumbStore';

const SCOPE = 'chrome';
const MODULE = './breadcrumbs/store';
const IMPORT_NAME = 'getBreadcrumbStore';

type GetBreadcrumbStore = () => BreadcrumbStore;

let storePromise: Promise<BreadcrumbStore> | null = null;

/**
 * Load the breadcrumb store through the `chrome` federated remote (self-consumption).
 * Memoized so every caller shares the same resolved singleton. On failure the memo
 * is cleared so a later call can retry.
 */
export const loadBreadcrumbStore = (): Promise<BreadcrumbStore> => {
  if (!storePromise) {
    storePromise = getModule<GetBreadcrumbStore>(SCOPE, MODULE, IMPORT_NAME)
      .then((getStore) => getStore())
      .catch((error) => {
        storePromise = null;
        throw error;
      });
  }
  return storePromise;
};

/** Synchronously return the store if the module is already loaded, otherwise undefined. */
export const getCachedBreadcrumbStore = (): BreadcrumbStore | undefined => {
  const getStore = getCachedModule<GetBreadcrumbStore>(SCOPE, MODULE).cachedModule?.[IMPORT_NAME];
  return typeof getStore === 'function' ? getStore() : undefined;
};

/** Warm the `chrome#./breadcrumbs/store` module so later reads resolve immediately. */
export const preloadBreadcrumbStore = (): Promise<unknown> => preloadModule(SCOPE, MODULE);

/**
 * React hook returning the breadcrumb store, or undefined until it resolves.
 * Seeds from the cached module so a warmed store is available on first render.
 */
export const useBreadcrumbStoreRef = (): BreadcrumbStore | undefined => {
  const cachedGetter = getCachedModule<GetBreadcrumbStore>(SCOPE, MODULE).cachedModule?.[IMPORT_NAME];
  const getStore = useModule<GetBreadcrumbStore>(SCOPE, MODULE, cachedGetter, IMPORT_NAME);
  return typeof getStore === 'function' ? getStore() : undefined;
};

/** @internal Reset the memoized store promise. For testing only. */
export const _resetBreadcrumbStoreBridge = () => {
  storePromise = null;
};
