import Workspace from '../Workspace';

/**
 * Represents the response for the "get the list of the user's workspaces"
 * coming from RBAC.
 */
interface RBACListWorkspacesResponse {
  meta: unknown;
  links: unknown;
  data: Workspace[];
}

export default RBACListWorkspacesResponse;
