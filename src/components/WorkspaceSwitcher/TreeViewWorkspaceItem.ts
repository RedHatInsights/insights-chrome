import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import Workspace from './Workspace';

/**
 * Extends the TreeViewDataItem to add the underlying workspace that the data
 * item represents.
 */
interface TreeViewWorkspaceItem extends TreeViewDataItem {
  workspace: Workspace;
}

/**
 *
 * @param treeViewDataItem
 * @returns
 */
function instanceOfTreeViewWorkspaceItem(treeViewDataItem: TreeViewDataItem): treeViewDataItem is TreeViewWorkspaceItem {
  return 'workspace' in treeViewDataItem;
}

export { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem };
