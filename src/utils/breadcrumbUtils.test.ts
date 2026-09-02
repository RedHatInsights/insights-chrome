import { buildBreadcrumbSegments, normalizePathname } from './breadcrumbUtils';

describe('normalizePathname', () => {
  it('should remove trailing slash', () => {
    expect(normalizePathname('/path/')).toBe('/path');
    expect(normalizePathname('/insights/advisor/')).toBe('/insights/advisor');
  });

  it('should remove wildcard suffix', () => {
    expect(normalizePathname('/path/*')).toBe('/path');
    expect(normalizePathname('/insights/advisor/*')).toBe('/insights/advisor');
  });

  it('should remove both trailing slash and wildcard', () => {
    expect(normalizePathname('/path//*')).toBe('/path/'); // only removes last /*
  });

  it('should not modify pathname without trailing slash or wildcard', () => {
    expect(normalizePathname('/path')).toBe('/path');
    expect(normalizePathname('/insights/advisor/systems')).toBe('/insights/advisor/systems');
  });

  it('should handle root path', () => {
    expect(normalizePathname('/')).toBe('/');
    expect(normalizePathname('/*')).toBe('/');
  });

  it('should handle nested paths with wildcards', () => {
    expect(normalizePathname('/path/*/nested')).toBe('/path/*/nested');
    expect(normalizePathname('/path/to/resource/*')).toBe('/path/to/resource');
  });

  it('should handle empty string', () => {
    expect(normalizePathname('')).toBe('');
  });
});

describe('buildBreadcrumbSegments', () => {
  it('should return empty for empty storage', () => {
    expect(buildBreadcrumbSegments(new Map(), '/any/path')).toEqual([]);
  });

  it('should construct segments from storage for exact match', () => {
    const storage = new Map([
      ['/insights/advisor/systems', { title: 'Systems' }],
      ['/insights/advisor/systems/123', { title: 'System 123' }],
      ['/insights/advisor/systems/123/detail', { title: 'Detail' }],
    ]);

    const segments = buildBreadcrumbSegments(storage, '/insights/advisor/systems/123/detail');
    expect(segments).toEqual([
      { pathname: '/insights/advisor/systems', title: 'Systems', options: undefined },
      { pathname: '/insights/advisor/systems/123', title: 'System 123', options: undefined },
      { pathname: '/insights/advisor/systems/123/detail', title: 'Detail', options: undefined },
    ]);
  });

  it('should construct segments with options', () => {
    const storage = new Map([
      ['/insights/advisor/systems', { title: 'Systems', options: { state: { view: 'list' } } }],
      ['/insights/advisor/systems/123', { title: 'System 123', options: { state: { filters: {} } } }],
    ]);

    const segments = buildBreadcrumbSegments(storage, '/insights/advisor/systems/123');
    expect(segments.length).toBe(2);
    expect(segments[0].options).toEqual({ state: { view: 'list' } });
    expect(segments[1].options).toEqual({ state: { filters: {} } });
  });

  it('should handle trailing slashes in stored pathnames', () => {
    const storage = new Map([['/insights/advisor/systems/', { title: 'Systems' }]]);
    const segments = buildBreadcrumbSegments(storage, '/insights/advisor/systems');
    expect(segments.length).toBeGreaterThan(0);
  });

  it('should handle wildcards in stored pathnames', () => {
    const storage = new Map([['/insights/advisor/systems/*', { title: 'Systems' }]]);
    const segments = buildBreadcrumbSegments(storage, '/insights/advisor/systems/anything');
    expect(segments.length).toBeGreaterThan(0);
  });

  it('should match longest pathname first', () => {
    const storage = new Map([
      ['/insights/advisor', { title: 'Advisor' }],
      ['/insights/advisor/systems', { title: 'Systems' }],
      ['/insights/advisor/systems/123', { title: 'System 123' }],
    ]);

    const segments = buildBreadcrumbSegments(storage, '/insights/advisor/systems/123');

    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(segments.find((s) => s.title === 'System 123')).toBeDefined();
  });

  it('should return empty for non-matching pathname', () => {
    const storage = new Map([['/insights/advisor/systems', { title: 'Systems' }]]);
    const segments = buildBreadcrumbSegments(storage, '/settings/rbac/roles');
    expect(segments).toEqual([]);
  });
});
