import { normalizePathname } from './breadcrumbUtils';

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
    expect(normalizePathname('/')).toBe('');
    expect(normalizePathname('/*')).toBe('');
  });

  it('should handle nested paths with wildcards', () => {
    expect(normalizePathname('/path/*/nested')).toBe('/path/*/nested');
    expect(normalizePathname('/path/to/resource/*')).toBe('/path/to/resource');
  });

  it('should handle empty string', () => {
    expect(normalizePathname('')).toBe('');
  });
});
