import { atom } from 'jotai';
import { atomWithToggle } from './utils';
import TreeViewWorkspaceItem from '../../components/WorkspaceSwitcher/TreeViewWorkspaceItem';

/**
 * Signals whether the workspace's dropdown menu is expanded.
 */
export const isWorkspacesMenuExpanded = atom(false);

/**
 * Signals whether the user's workspaces are being fetched from RBAC.
 */
export const isFetchingWorkspaces = atom(false);

/**
 * Signals whether there's been an error while fetching the user's workspaces
 * from RBAC.
 */
export const isFetchingWorkspacesError = atom(false);

/**
 * Signals whether the recently used workspaces are being fetched from Chrome.
 */
export const isFecthingRecentlyUsedWorkspaces = atomWithToggle(false);

/**
 * Signals whether there's been an error while fetching the most recently used
 * workspaces from Chrome.
 */
export const isFecthingRecentlyUsedWorkspacesError = atomWithToggle(false);

/**
 * Contains the currently selected workspace by the user.
 */
export const selectedWorkspace = atom<TreeViewWorkspaceItem>({});
