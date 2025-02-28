import { atom } from 'jotai';
import { TreeViewWorkspaceItem } from '../../components/WorkspaceSwitcher/TreeViewWorkspaceItem';
import Workspace from '../../components/WorkspaceSwitcher/Workspace';
import RecentlyUsedWorkspace from '../../components/WorkspaceSwitcher/RecentlyUsedWorkspace';

/**
 * Signals whether the workspace's dropdown menu is expanded.
 */
export const isWorkspacesMenuExpanded = atom<boolean>(false);

/**
 * Signals whether the user's workspaces are being fetched from RBAC.
 */
export const isFetchingWorkspacesFromRBAC = atom<boolean>(false);

/**
 * Signals whether there's been an error while fetching the user's workspaces
 * from RBAC.
 */
export const isFetchingWorkspacesFromRBACError = atom<boolean>(false);

/**
 * Signals whether the recently used workspaces are being fetched from Chrome.
 */
export const isFecthingRecentlyUsedWorkspaces = atom<boolean>(false);

/**
 * Signals whether there's been an error while fetching the most recently used
 * workspaces from Chrome.
 */
export const isFecthingRecentlyUsedWorkspacesError = atom<boolean>(false);

/**
 * Contains the currently selected workspace by the user.
 */
export const selectedWorkspace = atom<TreeViewWorkspaceItem | undefined>(undefined);

/**
 * Contains the flat list of workspaces fetched from RBAC.
 */
export const fetchedWorkspaces = atom<Workspace[]>([]);

/**
 * Contains the built tree of workspaces. The sinlge element is the root which
 * then contains the subtree of workspaces that grow from it.
 */
export const workspaceTree = atom<TreeViewWorkspaceItem | undefined>(undefined);

/**
 * Contains the recently used workspaces by the user.
 */
export const recentlyUsedWorkspaces = atom<RecentlyUsedWorkspace[]>([]);
