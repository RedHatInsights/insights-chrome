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
 * Normalize pathname for breadcrumb matching
 * Removes trailing slash and wildcard suffix
 *
 * @param pathname - The pathname to normalize
 * @returns Normalized pathname without trailing slash or wildcard
 *
 * @example
 * normalizePathname('/path/') // '/path'
 * normalizePathname('/path/*') // '/path'
 * normalizePathname('/path/to/resource') // '/path/to/resource'
 */
export function normalizePathname(pathname: string): string {
  // Preserve root path
  if (pathname === '/' || pathname === '/*') {
    return '/';
  }
  return pathname.replace(/\/$/, '').replace(/\/\*$/, '');
}

/**
 * Build the ordered app breadcrumb segments from the incremental storage Map
 * based on the current pathname. Pure function — no singleton / atom access —
 * so it can be shared by the exposed breadcrumb store and the host UI.
 */
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
