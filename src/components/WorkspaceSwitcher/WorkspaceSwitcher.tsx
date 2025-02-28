import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import {
  fetchedWorkspaces,
  isFetchingWorkspaces,
  isFetchingWorkspacesError,
  isWorkspacesMenuExpanded,
  selectedWorkspace,
  workspaceTree,
} from '../../state/atoms/workspacesAtom';
import { MenuContainer } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMain } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
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

  // State for the workspace the user selected.
  const [workspaceSelected, setSelectedWorkspace] = useAtom<TreeViewWorkspaceItem | undefined>(selectedWorkspace);

  // State values for when we are fetching workspaces from RBAC.
  const [isWorkspaceFetchingError, setWorkspaceFetchingError] = useAtom<boolean>(isFetchingWorkspacesError);
  const [isFetchingWorkspacesFromRBAC, setIsFetchingWorkspacesFromRBAC] = useAtom<boolean>(isFetchingWorkspaces);

  // State values for the built workspace tree and the flat list returned from
  // RBAC.
  const [fetchedWorkspacesFromRBAC, setFetchedWorkspacesFromRBAC] = useAtom<Workspace[]>(fetchedWorkspaces);
  const [workspacesTree, setWorkspacesTree] = useAtom<TreeViewWorkspaceItem | undefined>(workspaceTree);

  // References for the menu and the menu toggle.
  const menuRef = React.useRef<MenuToggleElement>(null);
  const toggleRef = React.useRef<MenuToggleElement>(null);

  /**
   * When the component loads the RBAC worskpaces are fetched for the user.
   */
  React.useEffect(() => {
    setIsFetchingWorkspacesFromRBAC(true);

    axios
      .get<RBACListWorkspacesResponse>('/api/rbac/v2/workspaces/')
      .then((axiosResponse) => {
        setWorkspaceFetchingError(false);
        setIsFetchingWorkspacesFromRBAC(false);

        setFetchedWorkspacesFromRBAC(axiosResponse.data.data);
        setWorkspacesTree(BuildWorkspaceTree(axiosResponse.data.data));
      })
      .catch((error) => {
        setWorkspaceFetchingError(true);
        console.log(`Unable to fetch workspaces from RBAC: ${error}`);
      });
  }, []);

  /**
   * When the component loads the recently used workspaces are fetched for
   * the user.
   */
  React.useEffect(() => {}, []);

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
            <Tabs activeKey={activeTabKey} onSelect={(_, tabKey) => setActiveTabKey(tabKey)} isFilled>
              <Tab eventKey={0} title={<TabTitleText>Recents</TabTitleText>}>
                <Panel>
                  <PanelMain>
                    <section>
                      <PanelMainBody>Recents</PanelMainBody>
                    </section>
                  </PanelMain>
                </Panel>
              </Tab>
              <Tab eventKey={1} title={<TabTitleText>All</TabTitleText>}>
                <Panel>
                  <PanelMain>
                    <section>
                      <PanelMainBody>
                        <WorkspaceTreeView
                          workspacesTree={workspacesTree}
                          selectedWorkspace={workspaceSelected}
                          onSelect={onSelectTreeViewWorkspaceItem}
                          isLoading={isFetchingWorkspacesFromRBAC}
                        />
                      </PanelMainBody>
                    </section>
                  </PanelMain>
                </Panel>
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
