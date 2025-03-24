import RecentlyUsedWorkspace from './RecentlyUsedWorkspace';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';

/**
 * Traverses the given tree and builds paths for the given workspaces.
 * @param workspaceTree the tree that will be traversed to build the paths
 * from.
 * @param workspaces the workspaces for which the paths need to be built.
 * @returns a list of recent workspace objects, which contain both the
 * workspace itself and the paths that were built for it. When a path could
 * not be figured out for the given elements, they are returned as a "recently
 * used workspace" too.
 */
function FindPathForWorkspaces(workspaceTree: TreeViewWorkspaceItem, workspaces: Workspace[]): RecentlyUsedWorkspace[] {
  // Map each received workspace that we need to find the path for to its ID.
  // The goal is to be able to doo fast lookups when traversing the tree,
  // instead of having to go loop through the whole given list every time we
  // want to check if the currently traversed tree element matches with any of
  // the given workspaces.
  const idWorkspaceMap: Map<string, Workspace> = new Map<string, Workspace>();
  for (const workspace of workspaces) {
    idWorkspaceMap.set(workspace.id, workspace);
  }

  // Define the resulting "recent workspaces" object that will be populated
  // while traversing the tree.
  const recentWorkspaces: RecentlyUsedWorkspace[] = [];

  // The nodes that we need to traverse.
  const nodes: TreeViewWorkspaceItem[] = [workspaceTree];

  // Traverse the tree using a depth first search algorithm. Since we are
  // traversing trees with no loops —not graphs—, we do not need the "visited"
  // element of the DFS algorithm.
  while (idWorkspaceMap.size > 0 && nodes.length > 0) {
    const node: TreeViewWorkspaceItem | undefined = nodes.pop();

    // Represents an edge case. The conditions of the while loop should prevent
    // this from happening, but better be safe than sorry.
    if (!node) {
      break;
    }

    // Another edge case where the node does not have an ID set, something that
    // is very unlikely.
    if (!node.id) {
      console.log(`The node ${node} did not have its ID set. Unable to build a path for it`);

      continue;
    }

    // If the current node is in the map of workspaces that we need to build
    // a path for, then build that path.
    if (idWorkspaceMap.has(node.id)) {
      const workspace: Workspace | undefined = idWorkspaceMap.get(node.id);
      if (!workspace) {
        console.log(`Unable to build path for workspace tree node ${node.id}`);
        continue;
      }

      // Build the path for the workspace.
      recentWorkspaces.push(buildPath(node, workspace));

      // Remove the workspace from our map, since we already proccessed it.
      idWorkspaceMap.delete(node.id);
    }

    // When the current node has children we need to push them to our "nodes
    // to traverse" stack. Also, since we are going to traverse those children
    // we do not have to pop the last element from the "current path" stack.
    if (node.children) {
      for (const child of node.children) {
        // A little type check to make TypeScript happy.
        if (instanceOfTreeViewWorkspaceItem(child)) {
          nodes.push(child);
        }
      }
    }
  }

  // Any leftover workspaces in the map need to be included too in the
  // resulting list.
  idWorkspaceMap.forEach((workspace) => {
    recentWorkspaces.push({
      workspace: workspace,
      workspacePath: [],
    });

    console.log(`DEBUG: Unable to find a path for workspace ${workspace}`);
  });

  return recentWorkspaces;
}

/**
 * Builds the path to the given workspace from the given current node that we
 * are traversing.
 * @param currentNode the current node of the tree that we are visiting.
 * @param workspace the workspace we need to build the path for.
 * @returns a RecentlyUsedWorkspace object for which the path to the given
 * workspace has been built.
 */
function buildPath(currentNode: TreeViewWorkspaceItem, workspace: Workspace): RecentlyUsedWorkspace {
  const recentWorkspace: RecentlyUsedWorkspace = {
    workspace: workspace,
    workspacePath: [],
  };

  // Build the path by pushing the name of the given node, and the names of
  // all the parents of the given node.
  let node: TreeViewWorkspaceItem | undefined = currentNode;
  while (node) {
    recentWorkspace.workspacePath.push(node.workspace.name);

    node = node.parentTreeViewItem;
  }

  // Reverse the array so that the root element of the path appears first.
  recentWorkspace.workspacePath.reverse();

  return recentWorkspace;
}

export default FindPathForWorkspaces;
