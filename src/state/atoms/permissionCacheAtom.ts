import { atom } from 'jotai';
import type { Access } from '@redhat-cloud-services/rbac-client/types';
import type { RbacClient } from '../../auth/rbac';

export type PermissionResult = { status: 'success'; permissions: Access[] } | { status: 'failure'; cacheable: boolean };

export type PermissionCacheEntry = {
  client: RbacClient;
  retryAt?: number;
  bypass?: Promise<PermissionResult>;
};

// Auth owns invalidation. Successful permissions stay local to each watcher;
// the HTTP client handles caching and coalescing of ordinary concurrent reads.
export const permissionCacheAtom = atom({
  generation: 0,
  entries: new Map<string, PermissionCacheEntry>(),
});
