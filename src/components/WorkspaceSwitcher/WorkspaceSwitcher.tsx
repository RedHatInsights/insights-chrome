import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { isFetchingWorkspaces, isFetchingWorkspacesError, isWorkspacesMenuExpanded, selectedWorkspace } from '../../state/atoms/workspacesAtom';
import { MenuContainer, MenuSearch, MenuSearchInput } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMain } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Tab } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { TabTitleText } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import { useAtom } from 'jotai';
import * as React from 'react';
import axios from 'axios';
import BuildWorkspaceTree from './WorskpaceTreeBuilder';
import RBACListWorkspacesResponse from './rbac/RBACListWorkspacesResponse';
import Workspace from './Workspace';
import WorkspaceMenuToggle from './WorkspaceMenuToggle';
import WorkspaceTreeView from './WorkspaceTreeView';

const WorkspaceSwitcher = () => {
  // State for when the menu toggle is expanded.
  const [isMenuContainerOpen, setMenuContainerOpen] = useAtom<boolean>(isWorkspacesMenuExpanded);

  // State for the selected tab.
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  const [workspaceSelected, setSelectedWorkspace] = useAtom<TreeViewWorkspaceItem>(selectedWorkspace);

  // State values for when we are fetching workspaces from RBAC.
  const [isWorkspaceFetchingError, setWorkspaceFetchingError] = useAtom<boolean>(isFetchingWorkspacesError);
  const [isFetchingWorkspacesFromRBAC, setIsFetchingWorkspacesFromRBAC] = useAtom<boolean>(isFetchingWorkspaces);
  const [fetchedWorkspacesFromRBAC, setFetchedWorkspacesFromRBAC] = React.useState<Workspace[]>([]);
  const [workspacesTree, setWorkspacesTree] = React.useState<TreeViewWorkspaceItem | undefined>();

  // References for the menu and the menu toggle.
  const menuRef = React.useRef<MenuToggleElement>(null);
  const toggleRef = React.useRef<MenuToggleElement>(null);
  /**
   * Handler which gets called when the user changes the selected workspace.
   * @param _ the fired event which gets ignored.
   * @param item the item that was selected.
   */
  const onSelectTreeViewWorkspaceItem = (_: React.MouseEvent, item: TreeViewDataItem) => {
    if (instanceOfTreeViewWorkspaceItem(item)) {
      setSelectedWorkspace(item);
    }
  };

  const handleFetchLastRecentlyUsedWorkspaces = React.useCallback(async () => {
    setIsFetchingWorkspacesFromRBAC(true);

    try {
      const axiosResponse = await axios.get<RBACListWorkspacesResponse>('/api/rbac/v2/workspaces/');

      console.log(`Fetched workspaces: ${axiosResponse}`);

      setWorkspaceFetchingError(false);
      setIsFetchingWorkspacesFromRBAC(false);

      setFetchedWorkspacesFromRBAC(axiosResponse.data.data);
      setWorkspacesTree(BuildWorkspaceTree(fetchedWorkspacesFromRBAC));
    } catch (error: unknown) {
      console.log(`Unable to fetch workspaces from RBAC: ${error}`);
      setWorkspaceFetchingError(true);
    }
  }, [isMenuContainerOpen]);

  React.useEffect(() => {
    handleFetchLastRecentlyUsedWorkspaces();
  }, [handleFetchLastRecentlyUsedWorkspaces]);

  /**
   * Every time workspaces are fetched from RBAC we need to generate the tree
   * view.
   */
  React.useEffect(() => {
    if (!fetchedWorkspacesFromRBAC || !(fetchedWorkspacesFromRBAC.length > 0)) {
      return;
    }

    setWorkspacesTree(BuildWorkspaceTree(fetchedWorkspacesFromRBAC));
  }, [fetchedWorkspacesFromRBAC]);

  const menuToggle = (
    <WorkspaceMenuToggle
      menuToggleRef={toggleRef}
      onMenuToggleClick={() => setMenuContainerOpen(!isMenuContainerOpen)}
      isMenuToggleExpanded={isMenuContainerOpen}
      selectedWorkspace={workspaceSelected}
    />
  );

  const menu = (
    <Panel ref={menuRef} variant="raised">
      <PanelMain>
        <section>
          <PanelMainBody>
            <MenuSearch>
              <MenuSearchInput>
                <SearchInput
                  value="Test"
                  aria-label="Filter menu items"
                  onChange={() => {
                    return;
                  }}
                />
              </MenuSearchInput>
            </MenuSearch>
          </PanelMainBody>
          <PanelMainBody>
            <Tabs activeKey={activeTabKey} onSelect={(_, tabKey) => setActiveTabKey(tabKey)} isFilled>
              <Tab eventKey={0} title={<TabTitleText>Recents</TabTitleText>}>
                Recents
              </Tab>
              <Tab eventKey={1} title={<TabTitleText>All</TabTitleText>}>
                <WorkspaceTreeView workspacesTree={workspacesTree} onSelect={onSelectTreeViewWorkspaceItem} selectedWorkspace={workspaceSelected} />
              </Tab>
            </Tabs>
          </PanelMainBody>
          <PanelMainBody>
            <Divider />
          </PanelMainBody>
          <PanelMainBody>
            <Button isBlock>View workspace list</Button>
          </PanelMainBody>
        </section>
      </PanelMain>
    </Panel>
  );

  return (
    <MenuContainer
      isOpen={isMenuContainerOpen}
      menu={menu}
      menuRef={menuRef}
      onOpenChange={(isOpen) => setMenuContainerOpen(isOpen)}
      onOpenChangeKeys={['Escape']}
      toggle={menuToggle}
      toggleRef={toggleRef}
    />
  );
};

export default WorkspaceSwitcher;
