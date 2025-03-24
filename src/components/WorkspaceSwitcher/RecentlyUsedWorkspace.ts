import Workspace from './Workspace';

/**
 * Represents a data strutcture that associates a workspace with its current
 * path in the workspace's tree the user has access to.
 */
interface RecentlyUsedWorkspace {
  workspace: Workspace;
  workspacePath: string[];
}

export default RecentlyUsedWorkspace;
