import { createKesselPermissions } from './kesselPermissions';
import { checkSelf, checkSelfBulk } from '@project-kessel/react-kessel-access-check/core/api-client';
import { fetchDefaultWorkspace } from '@project-kessel/react-kessel-access-check';

jest.mock('@project-kessel/react-kessel-access-check/core/api-client');
jest.mock('@project-kessel/react-kessel-access-check');

const mockedCheckSelf = checkSelf as jest.MockedFunction<typeof checkSelf>;
const mockedCheckSelfBulk = checkSelfBulk as jest.MockedFunction<typeof checkSelfBulk>;
const mockedFetchDefaultWorkspace = fetchDefaultWorkspace as jest.MockedFunction<typeof fetchDefaultWorkspace>;

const mockWorkspaceId = 'ws-default-123';

describe('kesselPermissions', () => {
  beforeEach(() => {
    mockedCheckSelf.mockReset();
    mockedCheckSelfBulk.mockReset();
    mockedFetchDefaultWorkspace.mockReset();
    mockedFetchDefaultWorkspace.mockResolvedValue({
      id: mockWorkspaceId,
      type: 'default',
      name: 'Default Workspace',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    });
  });

  describe('check', () => {
    test('should return true when relation is allowed', async () => {
      mockedCheckSelf.mockResolvedValueOnce({ allowed: 'ALLOWED_TRUE' });
      const permissions = createKesselPermissions();
      const result = await permissions.check('view');
      expect(result).toBe(true);
      expect(mockedCheckSelf).toHaveBeenCalledWith(
        expect.objectContaining({ baseUrl: '', apiPath: '/api/kessel/v1beta2' }),
        expect.objectContaining({
          relation: 'view',
          resource: { id: mockWorkspaceId, type: 'workspace', reporter: { type: 'rbac' } },
        })
      );
    });

    test('should return false when relation is denied', async () => {
      mockedCheckSelf.mockResolvedValueOnce({ allowed: 'ALLOWED_FALSE' });
      const permissions = createKesselPermissions();
      const result = await permissions.check('delete');
      expect(result).toBe(false);
    });

    test('should use provided resourceType and resourceId', async () => {
      mockedCheckSelf.mockResolvedValueOnce({ allowed: 'ALLOWED_TRUE' });
      const permissions = createKesselPermissions();
      await permissions.check('view', 'group', 'group-456');
      expect(mockedCheckSelf).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          resource: { id: 'group-456', type: 'group', reporter: { type: 'rbac' } },
        })
      );
      expect(mockedFetchDefaultWorkspace).not.toHaveBeenCalled();
    });

    test('should return false when workspace fetch fails', async () => {
      mockedFetchDefaultWorkspace.mockReset();
      mockedFetchDefaultWorkspace.mockRejectedValueOnce(new Error('fetch failed'));
      const permissions = createKesselPermissions();
      const result = await permissions.check('view');
      expect(result).toBe(false);
      expect(mockedCheckSelf).not.toHaveBeenCalled();
    });

    test('should return false on SDK error', async () => {
      mockedCheckSelf.mockRejectedValueOnce(new Error('Network Error'));
      const permissions = createKesselPermissions();
      const result = await permissions.check('view');
      expect(result).toBe(false);
    });
  });

  describe('checkAny', () => {
    test('should return true when at least one relation is allowed', async () => {
      mockedCheckSelfBulk.mockResolvedValueOnce({
        pairs: [
          {
            request: { object: { resourceId: mockWorkspaceId, resourceType: 'workspace', reporter: { type: 'rbac' } }, relation: 'edit' },
            item: { allowed: 'ALLOWED_FALSE' },
          },
          {
            request: { object: { resourceId: mockWorkspaceId, resourceType: 'workspace', reporter: { type: 'rbac' } }, relation: 'view' },
            item: { allowed: 'ALLOWED_TRUE' },
          },
        ],
      });
      const permissions = createKesselPermissions();
      const result = await permissions.checkAny(['edit', 'view']);
      expect(result).toBe(true);
    });

    test('should return false when all relations denied', async () => {
      mockedCheckSelfBulk.mockResolvedValueOnce({
        pairs: [
          {
            request: { object: { resourceId: mockWorkspaceId, resourceType: 'workspace', reporter: { type: 'rbac' } }, relation: 'edit' },
            item: { allowed: 'ALLOWED_FALSE' },
          },
          {
            request: { object: { resourceId: mockWorkspaceId, resourceType: 'workspace', reporter: { type: 'rbac' } }, relation: 'delete' },
            item: { allowed: 'ALLOWED_FALSE' },
          },
        ],
      });
      const permissions = createKesselPermissions();
      const result = await permissions.checkAny(['edit', 'delete']);
      expect(result).toBe(false);
    });

    test('should return false for empty relations', async () => {
      const permissions = createKesselPermissions();
      const result = await permissions.checkAny([]);
      expect(result).toBe(false);
    });

    test('should use checkSelf for single relation', async () => {
      mockedCheckSelf.mockResolvedValueOnce({ allowed: 'ALLOWED_TRUE' });
      const permissions = createKesselPermissions();
      await permissions.checkAny(['view']);
      expect(mockedCheckSelf).toHaveBeenCalled();
      expect(mockedCheckSelfBulk).not.toHaveBeenCalled();
    });

    test('should return false on SDK error', async () => {
      mockedCheckSelfBulk.mockRejectedValueOnce(new Error('Network Error'));
      const permissions = createKesselPermissions();
      const result = await permissions.checkAny(['edit', 'view']);
      expect(result).toBe(false);
    });

    test('should return false when resource is null for non-workspace type', async () => {
      const permissions = createKesselPermissions();
      const result = await permissions.checkAny(['view'], 'group');
      expect(result).toBe(false);
      expect(mockedCheckSelfBulk).not.toHaveBeenCalled();
    });
  });

  describe('checkAll', () => {
    test('should return per-relation results', async () => {
      mockedCheckSelfBulk.mockResolvedValueOnce({
        pairs: [
          {
            request: { object: { resourceId: mockWorkspaceId, resourceType: 'workspace', reporter: { type: 'rbac' } }, relation: 'view' },
            item: { allowed: 'ALLOWED_TRUE' },
          },
          {
            request: { object: { resourceId: mockWorkspaceId, resourceType: 'workspace', reporter: { type: 'rbac' } }, relation: 'delete' },
            item: { allowed: 'ALLOWED_FALSE' },
          },
        ],
      });
      const permissions = createKesselPermissions();
      const results = await permissions.checkAll(['view', 'delete']);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ allowed: true, relation: 'view', resource: { id: mockWorkspaceId, type: 'workspace' } });
      expect(results[1]).toEqual({ allowed: false, relation: 'delete', resource: { id: mockWorkspaceId, type: 'workspace' } });
    });

    test('should return empty array for empty relations', async () => {
      const permissions = createKesselPermissions();
      const results = await permissions.checkAll([]);
      expect(results).toEqual([]);
    });

    test('should return all-false results when workspace unavailable', async () => {
      mockedFetchDefaultWorkspace.mockReset();
      mockedFetchDefaultWorkspace.mockRejectedValueOnce(new Error('fetch failed'));
      const permissions = createKesselPermissions();
      const results = await permissions.checkAll(['view', 'edit']);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.allowed === false)).toBe(true);
    });

    test('should use checkSelf for single relation', async () => {
      mockedCheckSelf.mockResolvedValueOnce({ allowed: 'ALLOWED_TRUE' });
      const permissions = createKesselPermissions();
      const results = await permissions.checkAll(['view']);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ allowed: true, relation: 'view', resource: { id: mockWorkspaceId, type: 'workspace' } });
      expect(mockedCheckSelf).toHaveBeenCalled();
      expect(mockedCheckSelfBulk).not.toHaveBeenCalled();
    });

    test('should return all-false results on SDK error', async () => {
      mockedCheckSelfBulk.mockRejectedValueOnce(new Error('Network Error'));
      const permissions = createKesselPermissions();
      const results = await permissions.checkAll(['view', 'edit']);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.allowed === false)).toBe(true);
      expect(results[0]).toEqual({ allowed: false, relation: 'view', resource: { id: '', type: 'workspace' } });
    });

    test('should return all-false results on SDK error with custom resource type', async () => {
      mockedCheckSelf.mockRejectedValueOnce(new Error('Network Error'));
      const permissions = createKesselPermissions();
      const results = await permissions.checkAll(['view'], 'group', 'grp-1');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ allowed: false, relation: 'view', resource: { id: 'grp-1', type: 'group' } });
    });
  });
});
