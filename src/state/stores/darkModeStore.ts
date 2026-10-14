import { createSharedStore } from '@scalprum/core';
import { useGetState } from '@scalprum/react-core';

export interface DarkModeState {
  isDark: boolean;
}

const EVENTS = ['SET_DARK', 'SET_LIGHT'] as const;

export type DarkModeStore = ReturnType<typeof createSharedStore<DarkModeState, typeof EVENTS>>;

/**
 * The singleton is anchored on `globalThis` rather than module scope on purpose.
 *
 * This module is exposed via Module Federation as `./theme/useDarkModeStore` and
 * also statically imported by the host bootstrap (useTheme, Logo, etc.). Webpack
 * builds the exposed-entry graph separately from the host bootstrap graph,
 * producing two module factories for this file. A module-scoped `let store`
 * would be a SEPARATE instance per chunk — remote apps would write to one, Chrome
 * reads the other (the webpack duplicate-module-factory split, see PR #3607).
 * Anchoring the instance on the shared global realm collapses all copies onto one
 * store, guaranteeing a single instance across every chunk.
 */
const STORE_KEY = '__hcc_chrome_dark_mode_store__';

type DarkModeStoreGlobal = typeof globalThis & { [STORE_KEY]?: DarkModeStore };

const getInitialIsDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('pf-v6-theme-dark');

/**
 * Singleton accessor for the dark mode shared store.
 *
 * Exposed via Module Federation as `./theme/useDarkModeStore` so that Chrome and
 * its remote consumers resolve the SAME instance (single store), avoiding the
 * webpack duplicate-module-factory split.
 */
export const getDarkModeStore = (): DarkModeStore => {
  const globalScope = globalThis as DarkModeStoreGlobal;
  if (!globalScope[STORE_KEY]) {
    globalScope[STORE_KEY] = createSharedStore({
      initialState: { isDark: getInitialIsDark() } as DarkModeState,
      events: EVENTS,
      onEventChange: (state, event): DarkModeState => {
        switch (event) {
          case 'SET_DARK':
            return state.isDark ? state : { isDark: true };
          case 'SET_LIGHT':
            return state.isDark ? { isDark: false } : state;
          default:
            return state;
        }
      },
    });
  }
  return globalScope[STORE_KEY]!;
};

/** @internal Reset the store singleton. For testing only. */
export const _resetDarkModeStore = () => {
  delete (globalThis as DarkModeStoreGlobal)[STORE_KEY];
};

/**
 * Hook for remote modules to read the current dark mode state.
 * Exposed via Module Federation as `./theme/useDarkModeStore`.
 *
 * Usage in remote modules:
 * ```ts
 * const { isDark } = useDarkModeStore();
 * ```
 */
export const useDarkModeStore = () => {
  const darkModeStore = getDarkModeStore();
  const state = useGetState(darkModeStore);

  return {
    isDark: state.isDark,
  };
};
