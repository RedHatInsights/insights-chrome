import { findNavLeafPath, getErrorMessage, isExpandableNav, isFedModulesConfig } from './common';
import { NavItem } from '../@types/types';

describe('isExpandableNav', () => {
  it('returns true when expandable is true and navItems is an array', () => {
    const item: NavItem = { expandable: true, navItems: [{ title: 'Child', href: '/child' }] };
    expect(isExpandableNav(item)).toBe(true);
  });

  it('returns true when expandable is true and navItems is empty array', () => {
    const item: NavItem = { expandable: true, navItems: [] };
    expect(isExpandableNav(item)).toBe(true);
  });

  it('returns false when expandable is true but navItems is undefined', () => {
    const item: NavItem = { expandable: true };
    expect(isExpandableNav(item)).toBe(false);
  });

  it('returns false when expandable is false', () => {
    const item: NavItem = { expandable: false, navItems: [{ title: 'Child', href: '/child' }] };
    expect(isExpandableNav(item)).toBe(false);
  });

  it('returns false when expandable is undefined', () => {
    const item: NavItem = { title: 'Leaf', href: '/leaf' };
    expect(isExpandableNav(item)).toBe(false);
  });
});

describe('findNavLeafPath', () => {
  const makeMatcher = (targetHref: string) => (item: NavItem | undefined) => item?.href === targetHref;

  it('finds a leaf item in a flat list', () => {
    const navItems: NavItem[] = [
      { title: 'A', href: '/a' },
      { title: 'B', href: '/b' },
    ];
    const result = findNavLeafPath(navItems, makeMatcher('/b'));
    expect(result.activeItem).toEqual(expect.objectContaining({ href: '/b' }));
    expect(result.navItems).toEqual([]);
  });

  it('finds a leaf item in nested expandable navItems', () => {
    const navItems: NavItem[] = [
      {
        title: 'Parent',
        expandable: true,
        navItems: [{ title: 'Child', href: '/parent/child' }],
      },
    ];
    const result = findNavLeafPath(navItems, makeMatcher('/parent/child'));
    expect(result.activeItem).toEqual(expect.objectContaining({ href: '/parent/child' }));
    expect(result.navItems).toEqual([expect.objectContaining({ title: 'Parent' })]);
  });

  it('returns undefined activeItem when no match is found', () => {
    const navItems: NavItem[] = [{ title: 'A', href: '/a' }];
    const result = findNavLeafPath(navItems, makeMatcher('/nonexistent'));
    expect(result.activeItem).toBeUndefined();
    expect(result.navItems).toEqual([]);
  });

  it('handles expandable items with undefined navItems without crashing', () => {
    const navItems: NavItem[] = [
      { title: 'Bad Expandable', expandable: true },
      { title: 'Good Leaf', href: '/good' },
    ];
    const result = findNavLeafPath(navItems, makeMatcher('/good'));
    expect(result.activeItem).toEqual(expect.objectContaining({ href: '/good' }));
  });

  it('handles empty navItems array', () => {
    const result = findNavLeafPath([]);
    expect(result.activeItem).toBeUndefined();
    expect(result.navItems).toEqual([]);
  });

  it('handles undefined navItems without crashing', () => {
    const result = findNavLeafPath(undefined as unknown as NavItem[]);
    expect(result.activeItem).toBeUndefined();
    expect(result.navItems).toEqual([]);
  });

  it('handles null navItems without crashing', () => {
    const result = findNavLeafPath(null as unknown as NavItem[]);
    expect(result.activeItem).toBeUndefined();
    expect(result.navItems).toEqual([]);
  });

  it('handles undefined entries in navItems array', () => {
    const navItems = [undefined, { title: 'Valid', href: '/valid' }, undefined] as (NavItem | undefined)[];
    const result = findNavLeafPath(navItems, makeMatcher('/valid'));
    expect(result.activeItem).toEqual(expect.objectContaining({ href: '/valid' }));
  });

  it('builds full parent path for deeply nested items', () => {
    const navItems: NavItem[] = [
      {
        title: 'L1',
        expandable: true,
        navItems: [
          {
            title: 'L2',
            expandable: true,
            navItems: [{ title: 'L3', href: '/l1/l2/l3' }],
          },
        ],
      },
    ];
    const result = findNavLeafPath(navItems, makeMatcher('/l1/l2/l3'));
    expect(result.activeItem).toEqual(expect.objectContaining({ href: '/l1/l2/l3' }));
    expect(result.navItems.map((n) => n.title)).toEqual(['L1', 'L2']);
  });
});

describe('getErrorMessage', () => {
  it('extracts string errors', () => {
    expect(getErrorMessage('simple error')).toBe('simple error');
  });

  it('extracts message from Error instances', () => {
    expect(getErrorMessage(new Error('standard error'))).toBe('standard error');
  });

  it('extracts message from plain objects', () => {
    expect(getErrorMessage({ message: 'cross-frame error' })).toBe('cross-frame error');
  });

  it('returns fallback for null/undefined', () => {
    expect(getErrorMessage(null)).toBe('Unhandled UI runtime error');
    expect(getErrorMessage(undefined)).toBe('Unhandled UI runtime error');
  });

  it('returns fallback for non-error types', () => {
    expect(getErrorMessage(42)).toBe('Unhandled UI runtime error');
    expect(getErrorMessage(true)).toBe('Unhandled UI runtime error');
    expect(getErrorMessage({})).toBe('Unhandled UI runtime error');
  });

  it('returns fallback for non-string message properties', () => {
    expect(getErrorMessage({ message: 123 })).toBe('Unhandled UI runtime error');
    expect(getErrorMessage({ message: { nested: 'x' } })).toBe('Unhandled UI runtime error');
    expect(getErrorMessage({ message: null })).toBe('Unhandled UI runtime error');
  });

  it('uses custom fallback when provided', () => {
    expect(getErrorMessage(null, '')).toBe('');
    expect(getErrorMessage(undefined, 'custom')).toBe('custom');
    expect(getErrorMessage({ message: 456 }, 'default')).toBe('default');
  });
});

describe('isFedModulesConfig', () => {
  it('accepts valid fed-modules config map', () => {
    const validConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json' },
      app2: { manifestLocation: '/apps/app2/fed-mods.json', ssoUrl: 'https://sso.example.com' },
    };
    expect(isFedModulesConfig(validConfig)).toBe(true);
  });

  it('accepts config with optional $schema field', () => {
    const configWithSchema = {
      $schema: 'https://example.com/schema.json',
      app1: { manifestLocation: '/apps/app1/fed-mods.json' },
    };
    expect(isFedModulesConfig(configWithSchema)).toBe(true);
  });

  it('accepts empty config object', () => {
    expect(isFedModulesConfig({})).toBe(true);
  });

  it('rejects null', () => {
    expect(isFedModulesConfig(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isFedModulesConfig(undefined)).toBe(false);
  });

  it('rejects primitives', () => {
    expect(isFedModulesConfig('string')).toBe(false);
    expect(isFedModulesConfig(42)).toBe(false);
    expect(isFedModulesConfig(true)).toBe(false);
  });

  it('rejects array inputs before Object.entries iteration', () => {
    const arrayResponse = [{ manifestLocation: '/apps/app1/fed-mods.json' }, { manifestLocation: '/apps/app2/fed-mods.json' }];
    expect(isFedModulesConfig(arrayResponse)).toBe(false);
  });

  it('rejects empty array', () => {
    expect(isFedModulesConfig([])).toBe(false);
  });

  it('rejects config with module missing manifestLocation', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json' },
      app2: { ssoUrl: 'https://sso.example.com' }, // missing manifestLocation
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects config with non-string manifestLocation', () => {
    const invalidConfig = {
      app1: { manifestLocation: 123 },
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects config with null module value', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json' },
      app2: null,
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects config with non-object module value', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json' },
      app2: 'not-an-object',
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('accepts module with valid modules array', () => {
    const validConfig = {
      app1: {
        manifestLocation: '/apps/app1/fed-mods.json',
        modules: [{ module: 'App', routes: ['/app1', { pathname: '/app1/details' }] }],
      },
    };
    expect(isFedModulesConfig(validConfig)).toBe(true);
  });

  it('rejects module where modules is not an array', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json', modules: 'not-an-array' },
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects module with null RemoteModule entry', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json', modules: [null] },
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects RemoteModule with non-string module name', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json', modules: [{ module: 123, routes: [] }] },
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects RemoteModule where routes is not an array', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json', modules: [{ module: 'App', routes: null }] },
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects RemoteModule with malformed route entry', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json', modules: [{ module: 'App', routes: [null] }] },
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });

  it('rejects RemoteModule with route object missing pathname', () => {
    const invalidConfig = {
      app1: { manifestLocation: '/apps/app1/fed-mods.json', modules: [{ module: 'App', routes: [{ exact: true }] }] },
    };
    expect(isFedModulesConfig(invalidConfig)).toBe(false);
  });
});
