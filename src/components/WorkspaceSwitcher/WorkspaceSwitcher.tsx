import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuContainer } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel, PanelMain, PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { Tab, TabTitleText, Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import axios from 'axios';
import { useAtom } from 'jotai';
import * as React from 'react';
import {
  fetchedWorkspaces,
  isFecthingRecentlyUsedWorkspaces,
  isFetchingWorkspacesFromRBAC,
  isFetchingWorkspacesFromRBACError,
  isWorkspacesMenuExpanded,
  recentlyUsedWorkspaces,
  selectedWorkspace,
  workspaceTree,
} from '../../state/atoms/workspacesAtom';
import RecentlySavedWorkspacesResponse from './chrome/RecentlyUsedWorkspacesResponse';
import RBACListWorkspacesResponse from './rbac/RBACListWorkspacesResponse';
import RecentlyUsedWorkspace from './RecentlyUsedWorkspace';
import RecentWorkspacesComponent from './RecentWorkspacesComponent';
import FindPathForWorkspaces from './RecentWorkspacesManager';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';
import WorkspaceMenuToggle from './WorkspaceMenuToggle';
import WorkspaceTreeView from './WorkspaceTreeView';
import { BuildWorkspaceTree, FindWorkspaceInTree } from './WorskpaceTreeBuilder';

const WorkspaceSwitcher = () => {
  // State for when the menu toggle is expanded.
  const [isMenuContainerOpen, setMenuContainerOpen] = useAtom<boolean>(isWorkspacesMenuExpanded);

  // State for the selected tab.
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  // State for the workspace the user selected.
  const [workspaceSelected, setSelectedWorkspace] = useAtom<TreeViewWorkspaceItem | undefined>(selectedWorkspace);

  // State values for when we are fetching workspaces from RBAC.
  const [isWorkspaceFetchingError, setWorkspaceFetchingError] = useAtom<boolean>(isFetchingWorkspacesFromRBACError);
  const [isCurrentlyFetchingWorkspacesFromRBAC, setIsFetchingWorkspacesFromRBAC] = useAtom<boolean>(isFetchingWorkspacesFromRBAC);

  // State values fro when we are fetching the recently used workspaces from
  // Chrome.
  const [isCurrentlyFetchingRecentlyUsedWorkspaces, setCurrentlyFetchingRecentlyUsedWorkspaces] = useAtom<boolean>(isFecthingRecentlyUsedWorkspaces);
  const [isCurrentlyFetchingRecentlyUsedWorkspacesError, setCurrentlyFetchingRecentlyUsedWorkspacesError] =
    useAtom<boolean>(isFetchingWorkspacesFromRBACError);

  // A flag which tells us whether it's the first time we are fetching the
  // recently used workspaces or not. It is used to set the last element of
  // that list as the default selection.
  const [isFirstTimeFetchingRecentWorkspaces, setIsFirstTimeFetchingRecentWorkspaces] = React.useState<boolean>(false);

  // A React state for the raw, unprocessed response with the recently used
  // workspaces we received from Chrome. We still need to process this and add
  // the paths, that is why we don't use a Chrome state for this.
  const [RAWRecentlyUsedWorkspaces, setRAWRecentlyUsedWorkspaces] = React.useState<Workspace[]>([]);
  const [processedRecentlyUsedWorkspaces, setProcessedRecentlyUsedWorkspaces] = useAtom<RecentlyUsedWorkspace[]>(recentlyUsedWorkspaces);

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
  React.useEffect(() => {
    setCurrentlyFetchingRecentlyUsedWorkspaces(true);

    axios
      .get<RecentlySavedWorkspacesResponse>('/api/chrome-service/v1/recently-used-workspaces')
      .then((axiosResponse) => {
        setCurrentlyFetchingRecentlyUsedWorkspaces(false);
        setCurrentlyFetchingRecentlyUsedWorkspacesError(false);

        // We are interested in setting this flag variable conditionally
        // because if we receive an empty array, which is the default of
        // the "RAWRecentlyUsedWorkspaces" state variable, React will not
        // update the state of the latter variable.
        //
        // Then, if after a while the user selects a workspace, the other
        // effect this state variable is in will asume its the first time we
        // fetch the recent workspaces, and therefore will set the selected
        // workspace again which will cause some more rerenders. Not a big
        // issue, but we want to avoid it anyawys.
        setIsFirstTimeFetchingRecentWorkspaces(axiosResponse.data.data.length > 0);

        setRAWRecentlyUsedWorkspaces(axiosResponse.data.data);
      })
      .catch((error) => {
        setCurrentlyFetchingRecentlyUsedWorkspacesError(true);
        console.log(`Unable to fetch the recently used workspaces from Chrome: ${error}`);
      });
  }, []);

  /**
   * Build the workspace tree every time the fetched workspaces from RBAC
   * change.
   */
  React.useEffect(() => {
    const builtTree = BuildWorkspaceTree(fetchedWorkspacesFromRBAC);

    setWorkspacesTree(builtTree);
  }, [fetchedWorkspacesFromRBAC]);

  /**
   * Every time the workspaces tree or the fetched "recently used workspaces"
   * change we need to update the paths to the workspaces.
   */
  React.useEffect(() => {
    if (!workspacesTree || !RAWRecentlyUsedWorkspaces) {
      return;
    }

    // The first time we are fetching the recent workspaces we want to set the
    // most recent one as our selected workspace.
    if (isFirstTimeFetchingRecentWorkspaces) {
      setIsFirstTimeFetchingRecentWorkspaces(false);

      const treeElement = FindWorkspaceInTree(workspacesTree, RAWRecentlyUsedWorkspaces[0]);

      if (treeElement) {
        setSelectedWorkspace(treeElement);
      }
    }

    // Find the paths for all the recently used workspaces.
    const recentlyUsedWorkspaces: RecentlyUsedWorkspace[] = FindPathForWorkspaces(workspacesTree, RAWRecentlyUsedWorkspaces);

    // Update the state variable which contains all the recent workspaces.
    setProcessedRecentlyUsedWorkspaces(recentlyUsedWorkspaces);
  }, [workspacesTree, RAWRecentlyUsedWorkspaces]);

  /**
   * When the selected workspace changes, add it to our "recent workspaces"
   * list and send a request to Chrome to update the user's workspaces too.
   */
  React.useEffect(() => {
    if (!workspaceSelected) {
      return;
    }

    if (!workspacesTree) {
      return;
    }

    // First attempt finding it in our processed workspaces which already have
    // pathds. If it is there, we simply have to move it to the beginning of
    // the array. The index is there to help moving things around later.
    let isSelectedWorkspaceInOurList = false;
    let index = 0;
    for (; index < processedRecentlyUsedWorkspaces.length; index++) {
      if (workspaceSelected.workspace.id === processedRecentlyUsedWorkspaces[index].workspace.id) {
        isSelectedWorkspaceInOurList = true;
        break;
      }
    }

    // Make a copy of the list of already processed workspaces to not trigger
    // any state changes when moving things around in our list.
    const newRUWList = processedRecentlyUsedWorkspaces.slice();

    let recentlyUsedWorkspace: RecentlyUsedWorkspace;
    if (isSelectedWorkspaceInOurList) {
      // When the user selects the same workspace as the first one that we have
      // on our recents list, we don't have to update our recents list or send
      // any requests to Chrome.
      if (newRUWList.length > 0 && newRUWList[0].workspace.id === workspaceSelected.id) {
        return;
      }

      // When the selected workspace is part of the recently used workspaces that
      // we have saved in our state, then we just need to move that workspace to
      // the top of the list.
      //
      // Remove the element from the new array. The "splice" function returns
      // an array, so we need to get the element that got removed.
      recentlyUsedWorkspace = newRUWList.splice(index, 1)[0];
    } else {
      // When the workspace was not found in the recently used workspaces' list,
      // we need to figure out its path and
      recentlyUsedWorkspace = FindPathForWorkspaces(workspacesTree, [workspaceSelected.workspace])[0];
    }

    // Insert the recently used element.
    newRUWList.unshift(recentlyUsedWorkspace);

    // Update the state for the "recently used workspaces" atom.
    setProcessedRecentlyUsedWorkspaces(newRUWList);

    // Attempt saving the recent workspaces in Chrome.
    const workspacesList: Workspace[] = newRUWList.map((ruw) => ({ ...ruw.workspace }));

    axios
      .post('/api/chrome-service/v1/recently-used-workspaces', workspacesList)
      .then()
      .catch((error) => {
        console.log('Unable to save the recently used workspaces in Chrome: %s', error);
      });
  }, [workspaceSelected]);

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

  /**
   * Defines the menu toggle for the workspaces' selector.
   */
  const menuToggle = (
    <WorkspaceMenuToggle
      menuToggleRef={toggleRef}
      onMenuToggleClick={() => setMenuContainerOpen(!isMenuContainerOpen)}
      isDisabled={
        isWorkspaceFetchingError ||
        isCurrentlyFetchingWorkspacesFromRBAC ||
        isCurrentlyFetchingRecentlyUsedWorkspaces ||
        isCurrentlyFetchingRecentlyUsedWorkspacesError
      }
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
                      <RecentWorkspacesComponent recentlyUsedWorkspaces={processedRecentlyUsedWorkspaces} />
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
                          isLoading={isCurrentlyFetchingWorkspacesFromRBAC}
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
