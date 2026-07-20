import { type ApiConfig, checkSelf, checkSelfBulk } from '@project-kessel/react-kessel-access-check/core/api-client';
import { fetchDefaultWorkspace } from '@project-kessel/react-kessel-access-check';
import type { SelfAccessCheckResource } from '@project-kessel/react-kessel-access-check';

const KESSEL_API_CONFIG: ApiConfig = {
  baseUrl: '',
  apiPath: '/api/kessel/v1beta2',
};

export type ChromePermissionCheckResult = {
  allowed: boolean;
  relation: string;
  resource: {
    id: string;
    type: string;
  };
};

export type ChromePermissionsAPI = {
  /**
   * Check if the current user has the specified relation to the given resource.
   * Defaults to the org's default workspace when no resourceId is provided.
   *
   * @param relation - The Kessel relation to check (e.g. 'rbac_roles_read', 'view', 'edit')
   * @param resourceType - The resource type (e.g. 'workspace', 'group'). Defaults to 'workspace'.
   * @param resourceId - The resource ID. If omitted, uses the org's default workspace ID.
   * @returns Promise resolving to true if the user has the specified relation
   */
  check: (relation: string, resourceType?: string, resourceId?: string) => Promise<boolean>;

  /**
   * Check multiple relations in a single request (OR logic).
   * Returns true if the user has at least one of the specified relations.
   * Defaults to the org's default workspace when no resourceId is provided.
   *
   * @param relations - Array of Kessel relation strings
   * @param resourceType - The resource type. Defaults to 'workspace'.
   * @param resourceId - The resource ID. If omitted, uses the org's default workspace ID.
   * @returns Promise resolving to true if at least one relation is allowed
   */
  checkAny: (relations: string[], resourceType?: string, resourceId?: string) => Promise<boolean>;

  /**
   * Check multiple relations and return per-relation results.
   * Defaults to the org's default workspace when no resourceId is provided.
   *
   * @param relations - Array of Kessel relation strings
   * @param resourceType - The resource type. Defaults to 'workspace'.
   * @param resourceId - The resource ID. If omitted, uses the org's default workspace ID.
   * @returns Promise resolving to an array of per-relation results
   */
  checkAll: (relations: string[], resourceType?: string, resourceId?: string) => Promise<ChromePermissionCheckResult[]>;
};

export function createKesselPermissions(): ChromePermissionsAPI {
  // Instance-level workspace cache — reset on each createKesselPermissions() call
  // (called once per createChromeContext, which re-runs on token refresh)
  let workspacePromise: Promise<string | null> | null = null;

  function getDefaultWorkspaceId(): Promise<string | null> {
    if (!workspacePromise) {
      workspacePromise = fetchDefaultWorkspace('')
        .then((ws) => ws.id)
        .catch(() => null);
    }
    return workspacePromise;
  }

  async function resolveResource(resourceType = 'workspace', resourceId?: string): Promise<SelfAccessCheckResource | null> {
    let resolvedId = resourceId;
    if (!resolvedId && resourceType === 'workspace') {
      resolvedId = (await getDefaultWorkspaceId()) ?? undefined;
    }
    if (!resolvedId) {
      return null;
    }
    return {
      id: resolvedId,
      type: resourceType,
      reporter: { type: 'rbac' },
    };
  }
  return {
    check: async (relation, resourceType, resourceId) => {
      try {
        const resource = await resolveResource(resourceType, resourceId);
        if (!resource) {
          return false;
        }
        const response = await checkSelf(KESSEL_API_CONFIG, { relation, resource });
        return response.allowed === 'ALLOWED_TRUE';
      } catch (error) {
        console.error('permissions.check failed', error);
        return false;
      }
    },

    checkAny: async (relations, resourceType, resourceId) => {
      try {
        if (!Array.isArray(relations) || relations.length === 0) {
          return false;
        }
        const resource = await resolveResource(resourceType, resourceId);
        if (!resource) {
          return false;
        }
        const dedupedRelations = [...new Set(relations)];

        if (dedupedRelations.length === 1) {
          const response = await checkSelf(KESSEL_API_CONFIG, { relation: dedupedRelations[0], resource });
          return response.allowed === 'ALLOWED_TRUE';
        }

        const response = await checkSelfBulk(KESSEL_API_CONFIG, {
          items: dedupedRelations.map((relation) => ({ resource, relation })),
          consistency: { minimizeLatency: true },
        });
        return (response.pairs ?? []).some((r) => r.item?.allowed === 'ALLOWED_TRUE');
      } catch (error) {
        console.error('permissions.checkAny failed', error);
        return false;
      }
    },

    checkAll: async (relations, resourceType, resourceId) => {
      try {
        if (!Array.isArray(relations) || relations.length === 0) {
          return [];
        }
        const resource = await resolveResource(resourceType, resourceId);
        if (!resource) {
          return relations.map((relation) => ({
            allowed: false,
            relation,
            resource: { id: '', type: resourceType ?? 'workspace' },
          }));
        }
        const dedupedRelations = [...new Set(relations)];

        if (dedupedRelations.length === 1) {
          const response = await checkSelf(KESSEL_API_CONFIG, { relation: dedupedRelations[0], resource });
          return [
            {
              allowed: response.allowed === 'ALLOWED_TRUE',
              relation: dedupedRelations[0],
              resource: { id: resource.id, type: resource.type },
            },
          ];
        }

        const response = await checkSelfBulk(KESSEL_API_CONFIG, {
          items: dedupedRelations.map((relation) => ({ resource, relation })),
          consistency: { minimizeLatency: true },
        });
        return (response.pairs ?? []).map((pair) => ({
          allowed: pair.item?.allowed === 'ALLOWED_TRUE',
          relation: pair.request.relation,
          resource: { id: pair.request.object.resourceId, type: pair.request.object.resourceType },
        }));
      } catch (error) {
        console.error('permissions.checkAll failed', error);
        return relations.map((relation) => ({
          allowed: false,
          relation,
          resource: { id: resourceId ?? '', type: resourceType ?? 'workspace' },
        }));
      }
    },
  };
}
