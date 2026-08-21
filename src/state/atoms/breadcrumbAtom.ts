import { atom } from 'jotai';
import { matchPath } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';
import { normalizePathname } from '../../utils/breadcrumbUtils';

export type BreadcrumbEntry = {
  title: string;
  options?: NavigateOptions;
};

export type AppBreadcrumbSegment = {
  pathname: string;
  title: string;
  options?: NavigateOptions;
};

/**
 * Storage for incremental breadcrumb entries
 * Key: pathname (full path including bundle)
 * Value: { title, options }
 */
export const appBreadcrumbStorageAtom = atom<Map<string, BreadcrumbEntry>>(new Map());

/**
 * Boolean flag - true when using replace mode, false for incremental mode
 */
export const breadcrumbReplaceModeAtom = atom<boolean>(false);

/**
 * Override array for replace mode - full breadcrumb array set by useReplaceBreadcrumbs
 */
export const appBreadcrumbOverrideAtom = atom<AppBreadcrumbSegment[]>([]);

/**
 * Current pathname synced from useLocation() in the Breadcrumbs component.
 * Used by the derived atom instead of window.location.pathname for reactivity and testability.
 */
export const breadcrumbPathnameAtom = atom<string>('/');

/**
 * App mount pathname set by ChromeRoute when switching applications.
 * Examples: '/settings', '/insights/advisor', '/openshift/clusters'
 * Used to determine which Chrome breadcrumb segment to drop when app breadcrumbs are present.
 */
export const appMountPathnameAtom = atom<string | undefined>(undefined);

export function buildBreadcrumbSegments(storage: Map<string, BreadcrumbEntry>, currentPathname: string): AppBreadcrumbSegment[] {
  if (storage.size === 0) {
    return [];
  }

  // Sort once — reuse for both match finding and segment building
  const sortedStorageEntries = Array.from(storage.entries()).sort((a, b) => {
    const cleanA = normalizePathname(a[0]);
    const cleanB = normalizePathname(b[0]);
    return cleanB.length - cleanA.length;
  });

  let matchedPathname: string | null = null;

  for (const [storedPathname] of sortedStorageEntries) {
    const cleanedPath = normalizePathname(storedPathname);

    if (currentPathname === cleanedPath || currentPathname.startsWith(cleanedPath + '/')) {
      matchedPathname = storedPathname;
      break;
    }

    const match = matchPath({ path: `${cleanedPath}/*` }, currentPathname);
    if (match) {
      matchedPathname = storedPathname;
      break;
    }
  }

  if (!matchedPathname) {
    return [];
  }

  const segments: AppBreadcrumbSegment[] = [];
  const cleanedMatchedPath = normalizePathname(matchedPathname);
  const pathParts = cleanedMatchedPath.split('/').filter((part) => part.length > 0);

  for (let i = 0; i < pathParts.length; i++) {
    const segmentPath = '/' + pathParts.slice(0, i + 1).join('/');

    for (const [storedPathname, entry] of sortedStorageEntries) {
      const cleanedStoredPath = normalizePathname(storedPathname);

      if (cleanedStoredPath === segmentPath) {
        segments.push({
          pathname: segmentPath,
          title: entry.title,
          options: entry.options,
        });
        break;
      }

      const match = matchPath({ path: `${cleanedStoredPath}/*` }, segmentPath) || matchPath({ path: cleanedStoredPath }, segmentPath);
      if (match) {
        segments.push({
          pathname: segmentPath,
          title: entry.title,
          options: entry.options,
        });
        break;
      }
    }
  }

  return segments;
}

/**
 * Derived atom - computes breadcrumb segments from storage based on current pathname
 * Only active when replace mode is false
 */
export const appBreadcrumbSegmentsAtom = atom<AppBreadcrumbSegment[]>((get) => {
  const storage = get(appBreadcrumbStorageAtom);
  const isReplaceMode = get(breadcrumbReplaceModeAtom);

  if (isReplaceMode) {
    return [];
  }

  const currentPathname = get(breadcrumbPathnameAtom);
  return buildBreadcrumbSegments(storage, currentPathname);
});

/**
 * Write-only atom to clear all app breadcrumb state
 * Used when switching between applications
 */
export const clearAppBreadcrumbsAtom = atom(null, (_get, set) => {
  set(appBreadcrumbStorageAtom, new Map());
  set(breadcrumbReplaceModeAtom, false);
  set(appBreadcrumbOverrideAtom, []);
});
