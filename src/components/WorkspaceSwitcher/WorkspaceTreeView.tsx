import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Toolbar } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { ToolbarContent } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { ToolbarItem } from '@patternfly/react-core/dist/dynamic/components/Toolbar';
import { TreeView, TreeViewDataItem, TreeViewSearch } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import * as React from 'react';

interface WorkspaceTreeViewProps {
  workspacesTree: TreeViewWorkspaceItem | undefined;
  selectedWorkspace: TreeViewWorkspaceItem | undefined;
  onSelect: (event: React.MouseEvent, item: TreeViewDataItem, parentItem: TreeViewDataItem) => void;
  isLoading: boolean;
}

const WorkspaceTreeView = ({ workspacesTree, selectedWorkspace, onSelect, isLoading }: WorkspaceTreeViewProps) => {
  if (isLoading) {
    return (
      <div className="pf-v6-u-display-flex pf-v6-u-align-content-center">
        <Spinner />
      </div>
    );
  }

  const [filteredElements, setFilteredElements] = React.useState<TreeViewWorkspaceItem[]>([]);
  const [areElementsFiltered, setElementsAreFiltered] = React.useState<boolean>(false);

  if (workspacesTree) {
    setFilteredElements([workspacesTree]);
  }

  const onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchInput: string = event.target.value;

    if (searchInput === '') {
      setFilteredElements(filteredElements);
      setElementsAreFiltered(false);
    } else {
      // When there's no tree there's nothing to filter.
      if (!workspacesTree) {
        setElementsAreFiltered(false);
        return;
      }

      // When the tree only contains the root element we just have to check if
      // that element matches the given input string.
      if (!workspacesTree.children) {
        if (workspacesTree.workspace.name.toLowerCase().includes(searchInput)) {
          setFilteredElements([workspacesTree]);
          setElementsAreFiltered(true);
        }
      }

      const filteredElements = [workspacesTree].map((item) => Object.assign({}, item)).filter((item) => filterItems(item, searchInput));
      setFilteredElements(filteredElements);
      setElementsAreFiltered(true);
    }
  };

  const filterItems = (item: TreeViewDataItem | TreeViewWorkspaceItem, input: string): boolean => {
    // When the item does not have a name, which is an edge case that shouldn't
    // happen, then it can never be part of the filetered results.
    if (!item.name) {
      return false;
    }

    // When the item's name isn't a string, we can't really compare it to the
    // given input.
    if (typeof item.name !== 'string') {
      return false;
    }

    // When the item has children, we need to repeat the process to see if we
    // should include the subtree in the results too.
    if (item.children) {
      return (item.children = item.children.map((opt) => Object.assign({}, opt)).filter((child) => filterItems(child, input))).length > 0;
    }

    return false;
  };

  const searchToolbar = (
    <Toolbar style={{ padding: 0 }}>
      <ToolbarContent style={{ padding: 0 }}>
        <ToolbarItem>
          <TreeViewSearch onSearch={onSearch} id="input-search" name="search-input" aria-label="Search input example" />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  if (workspacesTree) {
    return (
      <TreeView
        activeItems={selectedWorkspace ? [selectedWorkspace] : []}
        allExpanded={areElementsFiltered}
        data={[workspacesTree]}
        hasGuides={true}
        onSelect={onSelect}
        toolbar={searchToolbar}
      />
    );
  } else {
    return (
      <TreeView
        activeItems={selectedWorkspace ? [selectedWorkspace] : []}
        allExpanded={areElementsFiltered}
        data={[{ name: 'placeholder workspace' }]}
        hasGuides={true}
        onSelect={onSelect}
        toolbar={searchToolbar}
      />
    );
  }
};

export default WorkspaceTreeView;
