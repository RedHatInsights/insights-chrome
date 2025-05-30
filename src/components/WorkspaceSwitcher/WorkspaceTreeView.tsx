import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { TreeView, TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import * as React from 'react';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';

interface WorkspaceTreeViewProps {
  treeElements: TreeViewWorkspaceItem[];
  areElementsFiltered: boolean;
  selectedWorkspace: TreeViewWorkspaceItem | undefined;
  onSelect: (event: React.MouseEvent, item: TreeViewDataItem, parentItem: TreeViewDataItem) => void;
  isLoading: boolean;
}

const WorkspaceTreeView = ({ treeElements, areElementsFiltered, selectedWorkspace, onSelect, isLoading }: WorkspaceTreeViewProps) => {
  if (isLoading) {
    return (
      <div className="pf-v6-u-display-flex pf-v6-u-align-content-center">
        <Spinner />
      </div>
    );
  }

  if (treeElements.length > 0) {
    return (
      <TreeView
        activeItems={selectedWorkspace ? [selectedWorkspace] : []}
        allExpanded={areElementsFiltered}
        data={treeElements}
        hasGuides={true}
        onSelect={onSelect}
      />
    );
  } else {
    return <p>No workspaces to show.</p>;
  }
};

export default WorkspaceTreeView;
