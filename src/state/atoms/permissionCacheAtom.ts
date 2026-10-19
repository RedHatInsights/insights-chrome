import { atom } from 'jotai';
import type { Access } from '@redhat-cloud-services/rbac-client/types';
import type createRbacAPI from '../../auth/rbac';

export type PermissionCacheEntry = {
  client: ReturnType<typeof createRbacAPI>;
} & (
  | { status: 'success'; permissions: Access[] }
  | { status: 'failure'; retryAt: number }
  | { status: 'pending'; promise: Promise<Access[]>; controller: AbortController }
);

type PermissionCache = {
  identity?: { orgId: string; userId: string | symbol };
  generation: number;
  entries: Map<string, PermissionCacheEntry>;
};

// Shared by navigation and chrome.getUserPermissions. Never persisted and never
// keyed by a token. HTTP clients belong to these entries, so invalidation also
// isolates their cached pages and any responses still arriving for an old user.
export const permissionCacheAtom = atom<PermissionCache>({ generation: 0, entries: new Map() });
