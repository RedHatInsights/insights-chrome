import { evaluateServiceTilesVisibility, filterHiddenItems } from './visibleBundlesAtom';
import { NavItem } from '../../@types/types';
import { AllServicesSection } from '../../components/AllServices/allServicesLinks';

jest.mock('../../utils/isNavItemVisible', () => ({
  evaluateVisibility: jest.fn((item: any) =>
    Promise.resolve({
      ...item,
      isHidden: item.title?.startsWith('hidden'),
    })
  ),
}));

describe('filterHiddenItems', () => {
  it('should remove items with isHidden: true', () => {
    const items: NavItem[] = [
      { title: 'visible', href: '/a' },
      { title: 'hidden', href: '/b', isHidden: true },
      { title: 'also visible', href: '/c' },
    ];
    const result = filterHiddenItems(items);
    expect(result).toEqual([expect.objectContaining({ title: 'visible' }), expect.objectContaining({ title: 'also visible' })]);
  });

  it('should recursively filter hidden navItems in groups', () => {
    const items: NavItem[] = [
      {
        title: 'group',
        groupId: 'g1',
        navItems: [
          { title: 'visible child', href: '/a' },
          { title: 'hidden child', href: '/b', isHidden: true },
        ],
      },
    ];
    const result = filterHiddenItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].navItems).toEqual([expect.objectContaining({ title: 'visible child' })]);
  });

  it('should recursively filter hidden routes in expandable items', () => {
    const items: NavItem[] = [
      {
        title: 'expandable',
        expandable: true,
        routes: [
          { title: 'v2 route', href: '/iam/access-management/roles' },
          { title: 'v1 route', href: '/iam/user-access/roles', isHidden: true },
        ],
      },
    ];
    const result = filterHiddenItems(items);
    expect(result[0].routes).toEqual([expect.objectContaining({ title: 'v2 route' })]);
  });

  it('should remove a parent group if it is hidden', () => {
    const items: NavItem[] = [
      {
        title: 'hidden group',
        groupId: 'g1',
        isHidden: true,
        navItems: [{ title: 'child', href: '/a' }],
      },
      { title: 'visible', href: '/b' },
    ];
    const result = filterHiddenItems(items);
    expect(result).toEqual([expect.objectContaining({ title: 'visible' })]);
  });

  it('should handle deeply nested hidden items', () => {
    const items: NavItem[] = [
      {
        title: 'group',
        groupId: 'g1',
        navItems: [
          {
            title: 'expandable',
            expandable: true,
            routes: [
              { title: 'deep visible', href: '/a' },
              { title: 'deep hidden', href: '/b', isHidden: true },
            ],
          },
        ],
      },
    ];
    const result = filterHiddenItems(items);
    expect(result[0].navItems![0].routes).toEqual([expect.objectContaining({ title: 'deep visible' })]);
  });

  it('should return empty array when all items are hidden', () => {
    const items: NavItem[] = [
      { title: 'a', href: '/a', isHidden: true },
      { title: 'b', href: '/b', isHidden: true },
    ];
    expect(filterHiddenItems(items)).toEqual([]);
  });

  it('should pass through items without navItems or routes unchanged', () => {
    const items: NavItem[] = [{ title: 'leaf', href: '/a', appId: 'foo' }];
    const result = filterHiddenItems(items);
    expect(result).toEqual([{ title: 'leaf', href: '/a', appId: 'foo' }]);
  });
});

describe('evaluateServiceTilesVisibility', () => {
  it('should remove hidden links from sections', async () => {
    const sections: AllServicesSection[] = [
      {
        title: 'IAM',
        links: [
          { href: '/iam/overview', title: 'Overview' },
          { href: '/iam/old', title: 'hidden legacy' },
        ],
      },
    ];
    const result = await evaluateServiceTilesVisibility(sections);
    expect(result).toHaveLength(1);
    expect(result[0].links).toEqual([expect.objectContaining({ title: 'Overview' })]);
  });

  it('should filter hidden links inside groups', async () => {
    const sections: AllServicesSection[] = [
      {
        title: 'Settings',
        links: [
          {
            isGroup: true,
            title: 'User Access',
            links: [
              { href: '/settings/rbac', title: 'RBAC' },
              { href: '/settings/old', title: 'hidden old page' },
            ],
          },
        ],
      },
    ];
    const result = await evaluateServiceTilesVisibility(sections);
    expect(result[0].links).toHaveLength(1);
    const group = result[0].links[0] as { isGroup: true; links: { title: string }[] };
    expect(group.links).toEqual([expect.objectContaining({ title: 'RBAC' })]);
  });

  it('should keep groups with all hidden children but empty their links', async () => {
    const sections: AllServicesSection[] = [
      {
        title: 'Section',
        links: [
          {
            isGroup: true,
            title: 'some group',
            links: [{ href: '/a', title: 'hidden child' }],
          },
          { href: '/b', title: 'visible link' },
        ],
      },
    ];
    const result = await evaluateServiceTilesVisibility(sections);
    expect(result[0].links).toHaveLength(2);
    const group = result[0].links[0] as { isGroup: true; links: { title: string }[] };
    expect(group.links).toEqual([]);
  });

  it('should preserve sections with no hidden items', async () => {
    const sections: AllServicesSection[] = [
      {
        title: 'Clean',
        links: [
          { href: '/a', title: 'first' },
          { href: '/b', title: 'second' },
        ],
      },
    ];
    const result = await evaluateServiceTilesVisibility(sections);
    expect(result[0].links).toHaveLength(2);
  });

  it('should return empty links when all are hidden', async () => {
    const sections: AllServicesSection[] = [
      {
        title: 'Empty',
        links: [
          { href: '/a', title: 'hidden one' },
          { href: '/b', title: 'hidden two' },
        ],
      },
    ];
    const result = await evaluateServiceTilesVisibility(sections);
    expect(result[0].links).toEqual([]);
  });
});
