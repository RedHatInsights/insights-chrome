import { createSharedStore } from '@scalprum/core';
import { useGetState } from '@scalprum/react-core';
import { type AppBreadcrumbSegment, type BreadcrumbEntry, buildBreadcrumbSegments } from '../../utils/breadcrumbUtils';

export interface BreadcrumbState {
  /** Incremental breadcrumb entries keyed by full pathname */
  storage: Map<string, BreadcrumbEntry>;
  /** True when an app uses replace mode instead of incremental mode */
  replaceMode: boolean;
  /** Full breadcrumb array set by useReplaceBreadcrumbs (replace mode only) */
  override: AppBreadcrumbSegment[];
  /** Current pathname synced from the Breadcrumbs component */
  pathname: string;
  /** App mount pathname set by ChromeRoute when switching applications */
  appMountPathname: string | undefined;
}

const EVENTS = ['SET_BREADCRUMB', 'REMOVE_BREADCRUMB', 'SET_REPLACE_MODE', 'SET_OVERRIDE', 'SET_PATHNAME', 'SET_APP_MOUNT_PATHNAME', 'CLEAR'] as const;

export type BreadcrumbStore = ReturnType<typeof createSharedStore<BreadcrumbState, typeof EVENTS>>;

/**
 * The singleton is anchored on `globalThis` rather than module scope on purpose.
 *
 * This module is exposed via Module Federation THREE times — directly as
 * `./breadcrumbs/store` and transitively through `./breadcrumbs/useBreadcrumbs`
 * and `./breadcrumbs/useReplaceBreadcrumbs` (both statically import it). Webpack's
 * `splitChunks` does NOT extract it into a single shared chunk; each exposed chunk
 * inlines its own copy of this module (verified in the production build). A
 * module-scoped `let store` would therefore be a SEPARATE instance per chunk, so
 * breadcrumbs written by the hook chunks would never reach the instance Chrome
 * reads via `./breadcrumbs/store` — the webpack duplicate-module-factory split
 * (see PR #3607). Anchoring the instance on the shared global realm collapses all
 * copies onto one store, guaranteeing a single instance across every chunk.
 */
const STORE_KEY = '__hcc_chrome_breadcrumb_store__';

type BreadcrumbStoreGlobal = typeof globalThis & { [STORE_KEY]?: BreadcrumbStore };

/**
 * Singleton accessor for the breadcrumb shared store.
 *
 * Exposed via Module Federation as `./breadcrumbs/store` so that Chrome and its
 * remote consumers resolve the SAME instance (single store), avoiding the
 * webpack duplicate-module-factory split that plagued the previous jotai atoms.
 */
export const getBreadcrumbStore = (): BreadcrumbStore => {
  const globalScope = globalThis as BreadcrumbStoreGlobal;
  if (!globalScope[STORE_KEY]) {
    globalScope[STORE_KEY] = createSharedStore({
      initialState: {
        storage: new Map<string, BreadcrumbEntry>(),
        replaceMode: false,
        override: [],
        pathname: '/',
        appMountPathname: undefined,
      } as BreadcrumbState,
      events: EVENTS,
      onEventChange: (state, event, payload): BreadcrumbState => {
        switch (event) {
          case 'SET_BREADCRUMB': {
            const { pathname, entry } = payload as { pathname: string; entry: BreadcrumbEntry };
            const nextStorage = new Map(state.storage);
            nextStorage.set(pathname, entry);
            return { ...state, storage: nextStorage };
          }
          case 'REMOVE_BREADCRUMB': {
            const { pathname } = payload as { pathname: string };
            if (!state.storage.has(pathname)) {
              return state;
            }
            const nextStorage = new Map(state.storage);
            nextStorage.delete(pathname);
            return { ...state, storage: nextStorage };
          }
          case 'SET_REPLACE_MODE': {
            const replaceMode = payload as boolean;
            return state.replaceMode === replaceMode ? state : { ...state, replaceMode };
          }
          case 'SET_OVERRIDE': {
            const override = payload as AppBreadcrumbSegment[];
            return { ...state, override };
          }
          case 'SET_PATHNAME': {
            const pathname = payload as string;
            return state.pathname === pathname ? state : { ...state, pathname };
          }
          case 'SET_APP_MOUNT_PATHNAME': {
            const appMountPathname = payload as string | undefined;
            return state.appMountPathname === appMountPathname ? state : { ...state, appMountPathname };
          }
          case 'CLEAR':
            // Reset app-provided breadcrumbs but preserve pathname/appMountPathname
            // (matches the old clearAppBreadcrumbsAtom behavior)
            return { ...state, storage: new Map<string, BreadcrumbEntry>(), replaceMode: false, override: [] };
          default:
            return state;
        }
      },
    });
  }
  return globalScope[STORE_KEY]!;
};

/** @internal Reset the store singleton. For testing only. */
export const _resetBreadcrumbStore = () => {
  delete (globalThis as BreadcrumbStoreGlobal)[STORE_KEY];
};

// Thin mutators — keep call sites terse and centralize the event contract.
export const setBreadcrumb = (pathname: string, entry: BreadcrumbEntry) => getBreadcrumbStore().updateState('SET_BREADCRUMB', { pathname, entry });

export const removeBreadcrumb = (pathname: string) => getBreadcrumbStore().updateState('REMOVE_BREADCRUMB', { pathname });

export const setReplaceMode = (replaceMode: boolean) => getBreadcrumbStore().updateState('SET_REPLACE_MODE', replaceMode);

export const setOverride = (override: AppBreadcrumbSegment[]) => getBreadcrumbStore().updateState('SET_OVERRIDE', override);

export const setPathname = (pathname: string) => getBreadcrumbStore().updateState('SET_PATHNAME', pathname);

export const setAppMountPathname = (appMountPathname: string | undefined) => getBreadcrumbStore().updateState('SET_APP_MOUNT_PATHNAME', appMountPathname);

export const clearBreadcrumbs = () => getBreadcrumbStore().updateState('CLEAR');

/**
 * Reactive selector hook for remote consumers that want the computed app
 * breadcrumb segments. Not used by Chrome's own UI (which merges chrome + app
 * segments itself), but exposed for completeness.
 */
export const useAppBreadcrumbSegments = (): AppBreadcrumbSegment[] => {
  const state = useGetState(getBreadcrumbStore());
  if (state.replaceMode) {
    return state.override;
  }
  return buildBreadcrumbSegments(state.storage, state.pathname);
};
