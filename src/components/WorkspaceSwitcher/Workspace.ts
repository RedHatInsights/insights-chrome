import WorkspaceType from './WorkspaceType';

/**
 * Represents a Workspace object.
 */
interface Workspace {
  id: string;
  parent_id?: string;
  type: WorkspaceType;
  name: string;
  description?: string;
  created?: string;
  updated?: string;
}

export default Workspace;
