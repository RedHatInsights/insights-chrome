import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import Workspace from './Workspace';

/**
 * Extends the TreeViewDataItem to add the underlying workspace that the data
 * item represents.
 */
interface TreeViewWorkspaceItem extends TreeViewDataItem {
  parentTreeViewItem?: TreeViewWorkspaceItem;
  workspace: Workspace;
}

/**
 * Determines whether the given TreeViewDataItem is in reality a
 * TreeViewWorkspaceItem or not.
 * @param treeViewDataItem the item to check.
 * @returns whether the given element is a TreeViewWorkspaceItem.
 */
function instanceOfTreeViewWorkspaceItem(treeViewDataItem: TreeViewDataItem): treeViewDataItem is TreeViewWorkspaceItem {
  return 'workspace' in treeViewDataItem;
}

export { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem };
