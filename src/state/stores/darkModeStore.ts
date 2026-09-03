import { createSharedStore } from '@scalprum/core';
import { useGetState } from '@scalprum/react-core';

interface DarkModeState {
  isDark: boolean;
}

const EVENTS = ['SET_DARK', 'SET_LIGHT'] as const;

type DarkModeStore = ReturnType<typeof createSharedStore<DarkModeState, typeof EVENTS>>;

// Anchor the singleton to window so Chrome's internal code and Module Federation
// consumers share the same instance even if webpack creates separate module closures.
const STORE_KEY = '__chrome_dark_mode_store__';

export const getDarkModeStore = (): DarkModeStore => {
  if (!window[STORE_KEY]) {
    window[STORE_KEY] = createSharedStore({
      initialState: { isDark: false } as DarkModeState,
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
  return window[STORE_KEY]!;
};

/** @internal Reset the store singleton. For testing only. */
export const _resetDarkModeStore = () => {
  delete window[STORE_KEY];
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
