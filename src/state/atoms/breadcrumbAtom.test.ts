import { createStore } from 'jotai';
import {
  appBreadcrumbOverrideAtom,
  appBreadcrumbSegmentsAtom,
  appBreadcrumbStorageAtom,
  breadcrumbPathnameAtom,
  breadcrumbReplaceModeAtom,
  buildBreadcrumbSegments,
  clearAppBreadcrumbsAtom,
} from './breadcrumbAtom';

describe('breadcrumbAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    store.set(breadcrumbPathnameAtom, '/insights/advisor/systems/123/detail');
  });

  describe('appBreadcrumbStorageAtom', () => {
    it('should initialize as empty Map', () => {
      const storage = store.get(appBreadcrumbStorageAtom);
      expect(storage).toBeInstanceOf(Map);
      expect(storage.size).toBe(0);
    });

    it('should store breadcrumb entries', () => {
      const entry = { title: 'Systems', options: { state: { view: 'list' } } };
      store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', entry]]));

      const storage = store.get(appBreadcrumbStorageAtom);
      expect(storage.get('/insights/advisor/systems')).toEqual(entry);
    });
  });

  describe('breadcrumbReplaceModeAtom', () => {
    it('should initialize as false', () => {
      const isReplaceMode = store.get(breadcrumbReplaceModeAtom);
      expect(isReplaceMode).toBe(false);
    });

    it('should toggle replace mode', () => {
      store.set(breadcrumbReplaceModeAtom, true);
      expect(store.get(breadcrumbReplaceModeAtom)).toBe(true);

      store.set(breadcrumbReplaceModeAtom, false);
      expect(store.get(breadcrumbReplaceModeAtom)).toBe(false);
    });
  });

  describe('appBreadcrumbOverrideAtom', () => {
    it('should initialize as empty array', () => {
      const override = store.get(appBreadcrumbOverrideAtom);
      expect(override).toEqual([]);
    });

    it('should store override breadcrumb array', () => {
      const breadcrumbs = [
        { pathname: '/insights/advisor/systems', title: 'Systems' },
        { pathname: '/insights/advisor/systems/123', title: 'System 123' },
      ];
      store.set(appBreadcrumbOverrideAtom, breadcrumbs);

      const override = store.get(appBreadcrumbOverrideAtom);
      expect(override).toEqual(breadcrumbs);
    });
  });

  describe('appBreadcrumbSegmentsAtom', () => {
    it('should return empty array when storage is empty', () => {
      const segments = store.get(appBreadcrumbSegmentsAtom);
      expect(segments).toEqual([]);
    });

    it('should return empty array when replace mode is active', () => {
      store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', { title: 'Systems' }]]));
      store.set(breadcrumbReplaceModeAtom, true);

      const segments = store.get(appBreadcrumbSegmentsAtom);
      expect(segments).toEqual([]);
    });

    it('should construct segments from storage for exact match', () => {
      store.set(
        appBreadcrumbStorageAtom,
        new Map([
          ['/insights/advisor/systems', { title: 'Systems' }],
          ['/insights/advisor/systems/123', { title: 'System 123' }],
          ['/insights/advisor/systems/123/detail', { title: 'Detail' }],
        ])
      );

      const segments = store.get(appBreadcrumbSegmentsAtom);
      expect(segments).toEqual([
        { pathname: '/insights/advisor/systems', title: 'Systems', options: undefined },
        { pathname: '/insights/advisor/systems/123', title: 'System 123', options: undefined },
        { pathname: '/insights/advisor/systems/123/detail', title: 'Detail', options: undefined },
      ]);
    });

    it('should construct segments with options', () => {
      store.set(breadcrumbPathnameAtom, '/insights/advisor/systems/123');

      store.set(
        appBreadcrumbStorageAtom,
        new Map([
          ['/insights/advisor/systems', { title: 'Systems', options: { state: { view: 'list' } } }],
          ['/insights/advisor/systems/123', { title: 'System 123', options: { state: { filters: {} } } }],
        ])
      );

      const segments = store.get(appBreadcrumbSegmentsAtom);
      expect(segments.length).toBe(2);
      expect(segments[0].options).toEqual({ state: { view: 'list' } });
      expect(segments[1].options).toEqual({ state: { filters: {} } });
    });

    it('should handle trailing slashes in pathnames', () => {
      store.set(breadcrumbPathnameAtom, '/insights/advisor/systems');

      store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems/', { title: 'Systems' }]]));

      const segments = store.get(appBreadcrumbSegmentsAtom);
      expect(segments.length).toBeGreaterThan(0);
    });

    it('should handle wildcards in pathnames', () => {
      store.set(breadcrumbPathnameAtom, '/insights/advisor/systems/anything');

      store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems/*', { title: 'Systems' }]]));

      const segments = store.get(appBreadcrumbSegmentsAtom);
      expect(segments.length).toBeGreaterThan(0);
    });

    it('should match longest pathname first', () => {
      store.set(breadcrumbPathnameAtom, '/insights/advisor/systems/123');

      store.set(
        appBreadcrumbStorageAtom,
        new Map([
          ['/insights/advisor', { title: 'Advisor' }],
          ['/insights/advisor/systems', { title: 'Systems' }],
          ['/insights/advisor/systems/123', { title: 'System 123' }],
        ])
      );

      const segments = store.get(appBreadcrumbSegmentsAtom);

      expect(segments.length).toBeGreaterThanOrEqual(2);
      expect(segments.find((s) => s.title === 'System 123')).toBeDefined();
    });

    it('should return empty for non-matching pathname', () => {
      store.set(breadcrumbPathnameAtom, '/settings/rbac/roles');

      store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', { title: 'Systems' }]]));

      const segments = store.get(appBreadcrumbSegmentsAtom);
      expect(segments).toEqual([]);
    });
  });

  describe('buildBreadcrumbSegments', () => {
    it('should return empty for empty storage', () => {
      expect(buildBreadcrumbSegments(new Map(), '/any/path')).toEqual([]);
    });

    it('should build segments from matched pathname', () => {
      const storage = new Map([
        ['/insights/advisor/systems', { title: 'Systems' }],
        ['/insights/advisor/systems/123', { title: 'System 123' }],
      ]);

      const segments = buildBreadcrumbSegments(storage, '/insights/advisor/systems/123');
      expect(segments).toEqual([
        { pathname: '/insights/advisor/systems', title: 'Systems', options: undefined },
        { pathname: '/insights/advisor/systems/123', title: 'System 123', options: undefined },
      ]);
    });
  });

  describe('clearAppBreadcrumbsAtom', () => {
    it('should clear all breadcrumb state', () => {
      store.set(appBreadcrumbStorageAtom, new Map([['/insights/advisor/systems', { title: 'Systems' }]]));
      store.set(breadcrumbReplaceModeAtom, true);
      store.set(appBreadcrumbOverrideAtom, [{ pathname: '/test', title: 'Test' }]);

      store.set(clearAppBreadcrumbsAtom);

      expect(store.get(appBreadcrumbStorageAtom).size).toBe(0);
      expect(store.get(breadcrumbReplaceModeAtom)).toBe(false);
      expect(store.get(appBreadcrumbOverrideAtom)).toEqual([]);
    });
  });
});
