import { evaluateVisibility } from './isNavItemVisible';
import { NavItem } from '../@types/types';

const mockIsOrgAdmin = jest.fn().mockResolvedValue(true);
const mockFeatureFlag = jest.fn().mockReturnValue(true);

jest.mock('./VisibilitySingleton', () => ({
  getVisibilityFunctions: () => ({
    isOrgAdmin: mockIsOrgAdmin,
    featureFlag: mockFeatureFlag,
  }),
}));

describe('evaluateVisibility', () => {
  beforeEach(() => {
    mockIsOrgAdmin.mockReset().mockResolvedValue(true);
    mockFeatureFlag.mockReset().mockReturnValue(true);
  });

  it('returns the item unchanged when it has no permissions', async () => {
    const item: NavItem = { title: 'Simple', href: '/simple' };
    const result = await evaluateVisibility(item);
    expect(result).toEqual({ ...item, isHidden: false });
  });

  it('marks the item hidden when permission check fails', async () => {
    mockIsOrgAdmin.mockResolvedValue(false);

    const item: NavItem = {
      title: 'Admin Only',
      href: '/admin',
      permissions: { method: 'isOrgAdmin', args: [] },
    };
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(true);
  });

  it('skips evaluation for already hidden items', async () => {
    const item: NavItem = { title: 'Hidden', href: '/hidden', isHidden: true };
    const result = await evaluateVisibility(item);
    expect(result).toEqual(item);
  });

  it('handles expandable item with navItems', async () => {
    const item: NavItem = {
      title: 'Expandable',
      expandable: true,
      navItems: [{ title: 'Child', href: '/child' }],
    };
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(false);
    expect(result.navItems).toHaveLength(1);
    expect(result.navItems![0]).toEqual(expect.objectContaining({ title: 'Child', isHidden: false }));
  });

  it('handles expandable item with undefined navItems without crashing', async () => {
    const item: NavItem = {
      title: 'Expandable No NavItems',
      expandable: true,
    };
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(false);
    expect(result.navItems).toBeUndefined();
  });

  it('handles expandable item with empty navItems', async () => {
    const item: NavItem = {
      title: 'Expandable Empty',
      expandable: true,
      navItems: [],
    };
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(false);
    expect(result.navItems).toEqual([]);
  });

  it('handles group item with navItems', async () => {
    const item: NavItem = {
      groupId: 'my-group',
      navItems: [{ title: 'Group Child', href: '/group-child' }],
    };
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(false);
    expect(result.navItems).toHaveLength(1);
    expect(result.navItems![0]).toEqual(expect.objectContaining({ title: 'Group Child', isHidden: false }));
  });

  it('handles group item with undefined navItems without crashing', async () => {
    const item: NavItem = {
      groupId: 'empty-group',
    };
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(false);
    expect(result.navItems).toBeUndefined();
  });

  it('should show nav item when scope permission matches a login scope (service-accounts pattern)', async () => {
    localStorage.setItem('@chrome/login-scopes', JSON.stringify(['openid', 'api.console', 'api.iam.service_accounts']));

    const item = {
      title: 'Service Accounts',
      href: '/iam/service-accounts',
      id: 'service-accounts',
      permissions: [
        { method: 'featureFlag', args: ['platform.rbac.workspaces', true] },
        { method: 'scope', args: ['api.iam.service_accounts'] },
      ],
    } as unknown as NavItem;
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(false);

    localStorage.removeItem('@chrome/login-scopes');
  });

  it('should hide nav item when scope permission does not match any login scope', async () => {
    localStorage.setItem('@chrome/login-scopes', JSON.stringify(['openid', 'api.console']));

    const item = {
      title: 'Service Accounts',
      href: '/iam/service-accounts',
      id: 'service-accounts',
      permissions: [
        { method: 'featureFlag', args: ['platform.rbac.workspaces', true] },
        { method: 'scope', args: ['api.iam.service_accounts'] },
      ],
    } as unknown as NavItem;
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(true);

    localStorage.removeItem('@chrome/login-scopes');
  });

  it('recursively evaluates nested expandable navItems', async () => {
    const item: NavItem = {
      title: 'Parent',
      expandable: true,
      navItems: [
        {
          title: 'Nested Expandable',
          expandable: true,
          navItems: [{ title: 'Deep Child', href: '/deep' }],
        },
      ],
    };
    const result = await evaluateVisibility(item);
    expect(result.navItems![0].navItems![0]).toEqual(expect.objectContaining({ title: 'Deep Child', isHidden: false }));
  });
});
