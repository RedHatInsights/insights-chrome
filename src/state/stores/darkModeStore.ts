import { createSharedStore } from '@scalprum/core';
import { useGetState } from '@scalprum/react-core';

interface DarkModeState {
  isDark: boolean;
}

const EVENTS = ['SET_DARK', 'SET_LIGHT'] as const;

let store: ReturnType<typeof createSharedStore<DarkModeState, typeof EVENTS>> | null = null;

export const getDarkModeStore = () => {
  if (!store) {
    store = createSharedStore({
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
  return store;
};

/** @internal Reset the store singleton. For testing only. */
export const _resetDarkModeStore = () => {
  store = null;
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

export default useDarkModeStore;
