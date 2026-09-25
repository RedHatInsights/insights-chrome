import { evaluateVisibility } from './isNavItemVisible';
import { NavItem } from '../@types/types';
import * as Sentry from '@sentry/react';

jest.mock('@sentry/react', () => ({ captureMessage: jest.fn() }));

const mockIsOrgAdmin = jest.fn().mockResolvedValue(true);
const mockFeatureFlag = jest.fn().mockReturnValue(true);

jest.mock('./VisibilitySingleton', () => ({
  getVisibilityFunctions: () => ({
    isOrgAdmin: mockIsOrgAdmin,
    featureFlag: mockFeatureFlag,
    scope: (requiredScope: string) => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem('@chrome/login-scopes') || '[]');
        if (!Array.isArray(parsed)) {
          return false;
        }
        return parsed.includes(requiredScope);
      } catch {
        return false;
      }
    },
  }),
}));

describe('evaluateVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsOrgAdmin.mockReset().mockResolvedValue(true);
    mockFeatureFlag.mockReset().mockReturnValue(true);
  });

  afterEach(() => {
    localStorage.removeItem('@chrome/login-scopes');
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
  });

  it('should hide nav item when login scopes storage contains non-array JSON', async () => {
    localStorage.setItem('@chrome/login-scopes', '"api.iam.service_accounts"');

    const item = {
      title: 'Service Accounts',
      href: '/iam/service-accounts',
      id: 'service-accounts',
      permissions: [{ method: 'scope', args: ['api.iam.service_accounts'] }],
    } as unknown as NavItem;
    const result = await evaluateVisibility(item);
    expect(result.isHidden).toBe(true);
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

  it.each(['throw', 'reject'])('isolates a visibility function that %ss from successful siblings', async (failure) => {
    mockIsOrgAdmin.mockImplementation(() => {
      if (failure === 'throw') throw new Error('private request data');
      return Promise.reject(new Error('private request data'));
    });
    const onError = jest.fn();
    const items: NavItem[] = [
      { id: 'broken', permissions: { method: 'isOrgAdmin', args: [] } },
      { id: 'working', permissions: { method: 'featureFlag', args: ['enabled', true] } },
    ];

    const results = await Promise.all(items.map((item) => evaluateVisibility(item, { source: 'navigation', bundleId: 'settings', onError })));

    expect(results.map(({ isHidden }) => isHidden)).toEqual([true, false]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Visibility evaluation failed', {
      level: 'warning',
      tags: { area: 'visibility', source: 'navigation', bundleId: 'settings', itemId: 'broken', method: 'isOrgAdmin' },
    });
    expect(JSON.stringify(jest.mocked(Sentry.captureMessage).mock.calls)).not.toContain('private request data');
  });

  it('preserves ancestors and siblings when a deeply nested item fails', async () => {
    mockIsOrgAdmin.mockRejectedValue(new Error('unavailable'));
    const item: NavItem = {
      id: 'parent',
      groupId: 'group',
      navItems: [
        { id: 'sibling', href: '/sibling' },
        {
          id: 'nested',
          expandable: true,
          navItems: [
            { id: 'broken', permissions: { method: 'isOrgAdmin', args: [] } },
            { id: 'working', href: '/working' },
          ],
        },
      ],
    };

    const result = await evaluateVisibility(item);

    expect(result.isHidden).toBe(false);
    expect(result.navItems?.map(({ isHidden }) => isHidden)).toEqual([false, false]);
    expect(result.navItems?.[1].navItems?.map(({ isHidden }) => isHidden)).toEqual([true, false]);
  });

  it('hides a parent whose own check throws without evaluating its children', async () => {
    mockIsOrgAdmin.mockRejectedValue(new Error('unavailable'));
    const result = await evaluateVisibility({
      permissions: { method: 'isOrgAdmin', args: [] },
      navItems: [{ permissions: { method: 'featureFlag', args: ['child', true] } }],
    } as NavItem);

    expect(result.isHidden).toBe(true);
    expect(mockFeatureFlag).not.toHaveBeenCalled();
  });

  it('hides an item if one of several conditions throws without reporting sensitive arguments', async () => {
    mockFeatureFlag.mockImplementation(() => {
      throw { config: { headers: { Authorization: 'secret-token' } } };
    });
    const result = await evaluateVisibility({
      id: 'multiple-conditions',
      permissions: [
        { method: 'isOrgAdmin', args: [] },
        { method: 'featureFlag', args: ['private-argument', true] },
      ],
    } as NavItem);

    expect(result.isHidden).toBe(true);
    expect(mockIsOrgAdmin).toHaveBeenCalled();
    const report = JSON.stringify(jest.mocked(Sentry.captureMessage).mock.calls);
    expect(report).not.toContain('secret-token');
    expect(report).not.toContain('private-argument');
  });

  it('does not report normal permission denial as degradation', async () => {
    mockIsOrgAdmin.mockResolvedValue(false);
    const onError = jest.fn();
    const result = await evaluateVisibility({ permissions: { method: 'isOrgAdmin', args: [] } } as NavItem, { onError });

    expect(result.isHidden).toBe(true);
    expect(onError).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
