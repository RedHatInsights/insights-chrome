import { act, renderHook } from '@testing-library/react';
import {
  _resetBreadcrumbStore,
  clearBreadcrumbs,
  getBreadcrumbStore,
  removeBreadcrumb,
  setAppMountPathname,
  setBreadcrumb,
  setDropLastChromeSegment,
  setOverride,
  setPathname,
  setReplaceMode,
  useAppBreadcrumbSegments,
} from './breadcrumbStore';

describe('breadcrumbStore', () => {
  beforeEach(() => {
    _resetBreadcrumbStore();
  });

  describe('getBreadcrumbStore', () => {
    it('should return a singleton store', () => {
      expect(getBreadcrumbStore()).toBe(getBreadcrumbStore());
    });

    it('should have expected initial state', () => {
      const state = getBreadcrumbStore().getState();
      expect(state.storage).toBeInstanceOf(Map);
      expect(state.storage.size).toBe(0);
      expect(state.replaceMode).toBe(false);
      expect(state.override).toEqual([]);
      expect(state.pathname).toBe('/');
      expect(state.appMountPathname).toBeUndefined();
      expect(state.dropLastChromeSegment).toBe(false);
    });
  });

  describe('SET_BREADCRUMB / removeBreadcrumb', () => {
    it('should add an entry immutably (new Map instance)', () => {
      const before = getBreadcrumbStore().getState().storage;
      setBreadcrumb('/insights/advisor/systems', { title: 'Systems' });
      const after = getBreadcrumbStore().getState().storage;

      expect(after).not.toBe(before);
      expect(after.get('/insights/advisor/systems')).toEqual({ title: 'Systems' });
    });

    it('should store options', () => {
      const entry = { title: 'Systems', options: { state: { view: 'list' } } };
      setBreadcrumb('/insights/advisor/systems', entry);
      expect(getBreadcrumbStore().getState().storage.get('/insights/advisor/systems')).toEqual(entry);
    });

    it('should remove an entry', () => {
      setBreadcrumb('/insights/advisor/systems', { title: 'Systems' });
      removeBreadcrumb('/insights/advisor/systems');
      expect(getBreadcrumbStore().getState().storage.has('/insights/advisor/systems')).toBe(false);
    });

    it('should return same state ref when removing a missing entry', () => {
      const before = getBreadcrumbStore().getState();
      removeBreadcrumb('/does/not/exist');
      expect(getBreadcrumbStore().getState()).toBe(before);
    });
  });

  describe('SET_REPLACE_MODE', () => {
    it('should toggle replace mode', () => {
      setReplaceMode(true);
      expect(getBreadcrumbStore().getState().replaceMode).toBe(true);
      setReplaceMode(false);
      expect(getBreadcrumbStore().getState().replaceMode).toBe(false);
    });

    it('should return same state ref when unchanged', () => {
      const before = getBreadcrumbStore().getState();
      setReplaceMode(false);
      expect(getBreadcrumbStore().getState()).toBe(before);
    });
  });

  describe('SET_OVERRIDE', () => {
    it('should set the override array', () => {
      const override = [{ pathname: '/a', title: 'A' }];
      setOverride(override);
      expect(getBreadcrumbStore().getState().override).toEqual(override);
    });
  });

  describe('SET_PATHNAME', () => {
    it('should set pathname', () => {
      setPathname('/insights/advisor');
      expect(getBreadcrumbStore().getState().pathname).toBe('/insights/advisor');
    });

    it('should return same state ref when unchanged', () => {
      setPathname('/insights/advisor');
      const before = getBreadcrumbStore().getState();
      setPathname('/insights/advisor');
      expect(getBreadcrumbStore().getState()).toBe(before);
    });
  });

  describe('SET_APP_MOUNT_PATHNAME', () => {
    it('should set the app mount pathname', () => {
      setAppMountPathname('/insights/advisor');
      expect(getBreadcrumbStore().getState().appMountPathname).toBe('/insights/advisor');
    });

    it('should return same state ref when unchanged', () => {
      const before = getBreadcrumbStore().getState();
      setAppMountPathname(undefined);
      expect(getBreadcrumbStore().getState()).toBe(before);
    });
  });

  describe('SET_DROP_LAST_CHROME_SEGMENT', () => {
    it('should set the drop-final Chrome segment option', () => {
      setDropLastChromeSegment(true);
      expect(getBreadcrumbStore().getState().dropLastChromeSegment).toBe(true);
    });
  });

  describe('CLEAR', () => {
    it('should reset storage/replaceMode/override but preserve pathname/appMountPathname', () => {
      setBreadcrumb('/insights/advisor/systems', { title: 'Systems' });
      setReplaceMode(true);
      setOverride([{ pathname: '/x', title: 'X' }]);
      setPathname('/insights/advisor/systems');
      setAppMountPathname('/insights/advisor');
      setDropLastChromeSegment(true);

      clearBreadcrumbs();

      const state = getBreadcrumbStore().getState();
      expect(state.storage.size).toBe(0);
      expect(state.replaceMode).toBe(false);
      expect(state.override).toEqual([]);
      // preserved
      expect(state.pathname).toBe('/insights/advisor/systems');
      expect(state.appMountPathname).toBe('/insights/advisor');
      expect(state.dropLastChromeSegment).toBe(false);
    });
  });

  describe('unsupported event', () => {
    it('should not mutate state', () => {
      const before = getBreadcrumbStore().getState();
      getBreadcrumbStore().updateState('UNKNOWN_EVENT' as never);
      expect(getBreadcrumbStore().getState()).toBe(before);
    });
  });

  describe('useAppBreadcrumbSegments', () => {
    it('should return incremental segments from storage', () => {
      setBreadcrumb('/insights/advisor/systems', { title: 'Systems' });
      setBreadcrumb('/insights/advisor/systems/123', { title: 'System 123' });
      setPathname('/insights/advisor/systems/123');

      const { result } = renderHook(() => useAppBreadcrumbSegments());
      expect(result.current).toEqual([
        { pathname: '/insights/advisor/systems', title: 'Systems', options: undefined },
        { pathname: '/insights/advisor/systems/123', title: 'System 123', options: undefined },
      ]);
    });

    it('should return the override in replace mode', () => {
      const override = [{ pathname: '/custom', title: 'Custom' }];
      setReplaceMode(true);
      setOverride(override);

      const { result } = renderHook(() => useAppBreadcrumbSegments());
      expect(result.current).toEqual(override);
    });

    it('should react to store updates', () => {
      setPathname('/insights/advisor/systems');
      const { result } = renderHook(() => useAppBreadcrumbSegments());
      expect(result.current).toEqual([]);

      act(() => {
        setBreadcrumb('/insights/advisor/systems', { title: 'Systems' });
      });

      expect(result.current).toEqual([{ pathname: '/insights/advisor/systems', title: 'Systems', options: undefined }]);
    });
  });
});
