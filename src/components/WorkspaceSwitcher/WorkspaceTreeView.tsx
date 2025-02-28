import { TreeView, TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import * as React from 'react';
import TreeViewWorkspaceItem from './TreeViewWorkspaceItem';

interface WorkspaceTreeViewProps {
  workspacesTree: TreeViewWorkspaceItem | undefined;
  onSelect: (event: React.MouseEvent, item: TreeViewDataItem, parentItem: TreeViewDataItem) => void;
  selectedWorkspace: TreeViewWorkspaceItem;
}

const WorkspaceTreeView = ({ workspacesTree, onSelect, selectedWorkspace }: WorkspaceTreeViewProps) => {
  if (workspacesTree) {
    return <TreeView data={[workspacesTree]} hasGuides={true} onSelect={onSelect} activeItems={[selectedWorkspace]} />;
  } else {
    return <TreeView data={[{ name: 'placeholder workspace' }]} hasGuides={true} onSelect={onSelect} activeItems={[selectedWorkspace]} />;
  }
};

export default WorkspaceTreeView;
