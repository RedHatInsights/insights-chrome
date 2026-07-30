import { atom } from 'jotai';
import { matchPath } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';

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

export function buildBreadcrumbSegments(storage: Map<string, BreadcrumbEntry>, currentPathname: string): AppBreadcrumbSegment[] {
  if (storage.size === 0) {
    return [];
  }

  const sortedPathnames = Array.from(storage.keys()).sort((a, b) => {
    const cleanA = a.replace(/\/$/, '').replace(/\/\*$/, '');
    const cleanB = b.replace(/\/$/, '').replace(/\/\*$/, '');
    return cleanB.length - cleanA.length;
  });

  let matchedPathname: string | null = null;

  for (const storedPathname of sortedPathnames) {
    const cleanedPath = storedPathname.replace(/\/$/, '').replace(/\/\*$/, '');

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
  const cleanedMatchedPath = matchedPathname.replace(/\/$/, '').replace(/\/\*$/, '');
  const pathParts = cleanedMatchedPath.split('/').filter((part) => part.length > 0);

  const sortedStorageEntries = Array.from(storage.entries()).sort((a, b) => {
    const cleanA = a[0].replace(/\/$/, '').replace(/\/\*$/, '');
    const cleanB = b[0].replace(/\/$/, '').replace(/\/\*$/, '');
    return cleanB.length - cleanA.length;
  });

  for (let i = 0; i < pathParts.length; i++) {
    const segmentPath = '/' + pathParts.slice(0, i + 1).join('/');

    for (const [storedPathname, entry] of sortedStorageEntries) {
      const cleanedStoredPath = storedPathname.replace(/\/$/, '').replace(/\/\*$/, '');

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
