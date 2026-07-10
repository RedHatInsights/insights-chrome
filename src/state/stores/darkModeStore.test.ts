import { act, renderHook } from '@testing-library/react';
import { _resetDarkModeStore, getDarkModeStore, useDarkModeStore } from './darkModeStore';

describe('darkModeStore', () => {
  beforeEach(() => {
    _resetDarkModeStore();
  });

  describe('getDarkModeStore', () => {
    it('should return a singleton store', () => {
      const store1 = getDarkModeStore();
      const store2 = getDarkModeStore();
      expect(store1).toBe(store2);
    });

    it('should have initial state isDark: false', () => {
      const store = getDarkModeStore();
      expect(store.getState()).toEqual({ isDark: false });
    });

    it('should set isDark to true on SET_DARK event', () => {
      const store = getDarkModeStore();
      store.updateState('SET_DARK');
      expect(store.getState()).toEqual({ isDark: true });
    });

    it('should set isDark to false on SET_LIGHT event', () => {
      const store = getDarkModeStore();
      store.updateState('SET_DARK');
      expect(store.getState()).toEqual({ isDark: true });
      store.updateState('SET_LIGHT');
      expect(store.getState()).toEqual({ isDark: false });
    });

    it('should not mutate state on unsupported event', () => {
      const store = getDarkModeStore();
      store.updateState('SET_DARK');
      expect(store.getState()).toEqual({ isDark: true });

      // Send an unsupported event — state should remain unchanged
      store.updateState('UNKNOWN_EVENT' as never);
      expect(store.getState()).toEqual({ isDark: true });
    });

    it('should return the same state reference when value is unchanged', () => {
      const store = getDarkModeStore();

      // SET_LIGHT when already light — should return same reference
      const lightState = store.getState();
      store.updateState('SET_LIGHT');
      expect(store.getState()).toBe(lightState);

      // SET_DARK changes value — new reference
      store.updateState('SET_DARK');
      const darkState = store.getState();
      expect(darkState).not.toBe(lightState);

      // SET_DARK when already dark — should return same reference
      store.updateState('SET_DARK');
      expect(store.getState()).toBe(darkState);
    });

    it('should toggle between dark and light states', () => {
      const store = getDarkModeStore();
      expect(store.getState().isDark).toBe(false);

      store.updateState('SET_DARK');
      expect(store.getState().isDark).toBe(true);

      store.updateState('SET_LIGHT');
      expect(store.getState().isDark).toBe(false);

      store.updateState('SET_DARK');
      expect(store.getState().isDark).toBe(true);
    });
  });

  describe('useDarkModeStore', () => {
    it('should return isDark from store state', () => {
      const { result } = renderHook(() => useDarkModeStore());
      expect(result.current.isDark).toBe(false);
    });

    it('should reflect store updates', () => {
      const { result } = renderHook(() => useDarkModeStore());
      const store = getDarkModeStore();

      expect(result.current.isDark).toBe(false);

      act(() => {
        store.updateState('SET_DARK');
      });

      expect(result.current.isDark).toBe(true);

      act(() => {
        store.updateState('SET_LIGHT');
      });

      expect(result.current.isDark).toBe(false);
    });
  });
});
