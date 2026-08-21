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
