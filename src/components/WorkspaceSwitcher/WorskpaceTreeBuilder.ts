import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';
import WorkspaceType from './WorkspaceType';

/**
 * Builds a workspace tree from the given list of workspaces.
 * @param wps the list of workspaces to build the tree from.
 * @returns a single root item of the workspace, which contains all the
 * subworkspaces in its children property.
 */
function BuildWorkspaceTree(wps: Workspace[]): TreeViewWorkspaceItem | undefined {
  if (wps.length == 0) {
    return undefined;
  }

  // Convert all the incoming workspaces to TreeViewWorkspaceItems, and
  // identify the root workspace.
  const workspaces: TreeViewWorkspaceItem[] = [];
  let rootWorkspace: TreeViewWorkspaceItem | undefined = undefined;

  for (const workspace of wps) {
    const tvwi: TreeViewWorkspaceItem = {
      id: workspace.id,
      name: workspace.name,
      workspace: workspace,
    };

    workspaces.push(tvwi);

    // Get the root workspace. In the case that no root workspace has been
    // received, then the default workspace takes preference.
    if (tvwi.workspace.type === WorkspaceType.ROOT || (tvwi.workspace.type === WorkspaceType.DEFAULT && rootWorkspace === undefined)) {
      rootWorkspace = tvwi;
    }

    // A workspace without a parent ID should either be a "root" or a "default"
    // workspace. In the extremely rare case where there is a non-root or non-
    // default workspace without a parent ID, we should just log it to help
    // figure out why an incomplete list of workspaces might be shown.
    if (tvwi.workspace.parent_id === undefined && tvwi.workspace.type !== WorkspaceType.ROOT && tvwi.workspace.type !== WorkspaceType.DEFAULT) {
      console.log(
        `WARNING: non-root or non-default workspace has no parent ID. It will not be added to the root workspace and might seem like it is missing: ${tvwi.workspace}`
      );
    }
  }

  // There should always exist either a root or default workspace.
  if (rootWorkspace === undefined) {
    return undefined;
  }

  // Push the root workspace to the nodes that we are about to traverse.
  const nodes: TreeViewWorkspaceItem[] = [rootWorkspace];
  while (nodes.length > 0) {
    const node = nodes.pop();

    // Find all the children workspaces of the given node by looping through
    // all the available workspaces.
    for (const workspace of workspaces) {
      if (workspace.workspace.parent_id === node?.id) {
        // Initialize the node's children in case it is not already.
        if (!node.children) {
          node.children = [];
        }

        // Link every child to its parent.
        workspace.parentTreeViewItem = node;

        // Add the workspace to the current node's children.
        node.children?.push(workspace);

        // Push the children to the list of nodes we need to find the children
        // for, to find the subtrees for each chidlren.
        nodes.push(workspace);
      }
    }
  }

  return rootWorkspace;
}

export default BuildWorkspaceTree;
