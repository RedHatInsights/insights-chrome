import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuContainer } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel, PanelMain, PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { Tab, TabTitleText, Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { useFlag } from '@unleash/proxy-client-react';
import axios, { AxiosResponse } from 'axios';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as React from 'react';
import {
  fetchedWorkspaces,
  isFecthingRecentlyUsedWorkspaces,
  isFecthingRecentlyUsedWorkspacesError,
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
import BuildWorkspaceTree from './WorskpaceTreeBuilder';

/**
 * Defines the statuses we want to update in an atomic fashion when fetching
 * the workspaces from RBAC.
 */
interface CombinedRBACFetchingStatus {
  isCurrentlyFetchingWorkspacesFromRBAC: boolean;
  didFetchingWorkspacesFromRBACFail: boolean;
}

/**
 * An atom that helps updating the statuses in an atomic fashion when fetching
 * the worksapces from RBAC.
 */
const RBACRestApiStatusWriteAtom = atom(null, (_, set, arg: CombinedRBACFetchingStatus) => {
  set(isFetchingWorkspacesFromRBAC, arg.isCurrentlyFetchingWorkspacesFromRBAC);
  set(isFetchingWorkspacesFromRBACError, arg.didFetchingWorkspacesFromRBACFail);
});

/**
 * Fetches the principal's workspaces from RBAC.
 * @returns the promise of the HTTP call.
 */
const fetchWorkspacesFromRBAC = (): Promise<AxiosResponse<RBACListWorkspacesResponse>> => {
  return axios.get<RBACListWorkspacesResponse>('/api/rbac/v2/workspaces/');
};

/**
 * Defines the statuses we want to update in an atomic fashion when fecthing
 * the recently used workspaces from Chrome.
 */
interface CombinedChromeFetchingStatus {
  isCurrentlyFetchingRecentlyUsedWorkspacesFromChrome: boolean;
  didFetchingRecentlyUsedWorkspacesFromChromeFail: boolean;
}

/**
 * An atom that helps updating the statuses in an atomic fashion when fetching
 * the recently used workspaces from Chrome.
 */
const ChromeRestApiStatusWriteAtom = atom(null, (_, set, arg: CombinedChromeFetchingStatus) => {
  set(isFecthingRecentlyUsedWorkspaces, arg.isCurrentlyFetchingRecentlyUsedWorkspacesFromChrome);
  set(isFecthingRecentlyUsedWorkspacesError, arg.didFetchingRecentlyUsedWorkspacesFromChromeFail);
});

/**
 * Fetches the principal's recently used workspaces from Chrome.
 * @returns the promise of the HTTP call.
 */
const fetchRecentlyUsedWorkspacesFromChrome = (): Promise<AxiosResponse<RecentlySavedWorkspacesResponse>> => {
  return axios.get<RecentlySavedWorkspacesResponse>('/api/chrome-service/v1/recently-used-workspaces');
};

const WorkspaceSwitcher = () => {
  const myFlaggy = useFlag('platform.chrome.workspace-switcher');
  console.log(`My flag ${myFlaggy}`);

  // State for when the menu toggle is expanded.
  const [isMenuContainerOpen, setMenuContainerOpen] = useAtom<boolean>(isWorkspacesMenuExpanded);

  // State for the selected tab.
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  // State for the workspace the user selected.
  const [workspaceSelected, setSelectedWorkspace] = useAtom<TreeViewWorkspaceItem | undefined>(selectedWorkspace);

  // State values for when we are fetching workspaces from RBAC.
  const setRBACFetchOperationResult = useSetAtom(RBACRestApiStatusWriteAtom);
  const isWorkspaceFetchingError = useAtomValue<boolean>(isFetchingWorkspacesFromRBACError);
  const isCurrentlyFetchingWorkspacesFromRBAC = useAtomValue<boolean>(isFetchingWorkspacesFromRBAC);

  // State values fro when we are fetching the recently used workspaces from
  // Chrome.
  const setChromeFetchOperationResult = useSetAtom(ChromeRestApiStatusWriteAtom);
  const isCurrentlyFetchingRecentlyUsedWorkspaces = useAtomValue<boolean>(isFecthingRecentlyUsedWorkspaces);
  const isCurrentlyFetchingRecentlyUsedWorkspacesError = useAtomValue<boolean>(isFecthingRecentlyUsedWorkspacesError);

  // A React state for the raw, unprocessed response with the recently used
  // workspaces we received from Chrome. We still need to process this and add
  // the paths, that is why we don't use a Chrome state for this.
  const [processedRecentlyUsedWorkspaces, setProcessedRecentlyUsedWorkspaces] = useAtom<RecentlyUsedWorkspace[]>(recentlyUsedWorkspaces);

  // State values for the built workspace tree and the flat list returned from
  // RBAC.
  const setFetchedWorkspacesFromRBAC = useSetAtom(fetchedWorkspaces);
  const [workspacesTree, setWorkspacesTree] = useAtom<TreeViewWorkspaceItem | undefined>(workspaceTree);

  // References for the menu and the menu toggle.
  const menuRef = React.useRef<MenuToggleElement>(null);
  const toggleRef = React.useRef<MenuToggleElement>(null);

  /**
   * Fetches the workspaces of the principal from RBAC and builds the tree with
   * them.
   * @param treeCallBack any callback that the caller might want to execute
   * with the built tree.
   */
  const fetchWorkspacesFromRBACBuildTree = (treeCallBack: ((tree: TreeViewWorkspaceItem) => void) | undefined = undefined) => {
    setRBACFetchOperationResult({ isCurrentlyFetchingWorkspacesFromRBAC: true, didFetchingWorkspacesFromRBACFail: false });

    fetchWorkspacesFromRBAC()
      .then((rbacResponse) => {
        setRBACFetchOperationResult({ isCurrentlyFetchingWorkspacesFromRBAC: false, didFetchingWorkspacesFromRBACFail: false });

        // Store the RAW fetched workspaces from RBAC in the state variable, in
        // case anyone wants to use them.
        setFetchedWorkspacesFromRBAC(rbacResponse.data.data);

        // Build the tree of workspaces with the fetched results.
        const tree = BuildWorkspaceTree(rbacResponse.data.data);
        setWorkspacesTree(tree);

        if (!treeCallBack || !tree) {
          return;
        } else {
          treeCallBack(tree);
        }
      })
      .catch((error) => {
        setRBACFetchOperationResult({ isCurrentlyFetchingWorkspacesFromRBAC: false, didFetchingWorkspacesFromRBACFail: true });

        console.log(`Unable to fetch workspaces from RBAC: ${error}`);
      });
  };

  /**
   * Fetches the recently used workspaces from Chrome and builds the paths for
   * each one of those workspaces.
   * @param tree the tree that is required to build the paths from.
   */
  const fetchRecentlyUsedWorkspacesChromeBuildPaths = (tree: TreeViewWorkspaceItem) => {
    setChromeFetchOperationResult({
      isCurrentlyFetchingRecentlyUsedWorkspacesFromChrome: true,
      didFetchingRecentlyUsedWorkspacesFromChromeFail: false,
    });

    fetchRecentlyUsedWorkspacesFromChrome()
      .then((chromeResponse) => {
        setChromeFetchOperationResult({
          isCurrentlyFetchingRecentlyUsedWorkspacesFromChrome: false,
          didFetchingRecentlyUsedWorkspacesFromChromeFail: false,
        });

        // Find the paths for all the recently used workspaces.
        const recentlyUsedWorkspaces: RecentlyUsedWorkspace[] = FindPathForWorkspaces(tree, chromeResponse.data.data);

        // Update the state variable which contains all the recent workspaces.
        setProcessedRecentlyUsedWorkspaces(recentlyUsedWorkspaces);
      })
      .catch((error) => {
        setChromeFetchOperationResult({
          isCurrentlyFetchingRecentlyUsedWorkspacesFromChrome: false,
          didFetchingRecentlyUsedWorkspacesFromChromeFail: true,
        });
        console.log(`Unable to fetch the recently used workspaces from Chrome: ${error}`);
      });
  };

  /**
   * When the component loads the RBAC worskpaces are fetched for the user.
   */
  React.useEffect(() => {
    fetchWorkspacesFromRBACBuildTree(fetchRecentlyUsedWorkspacesChromeBuildPaths);

    const timeout = setInterval(() => {
      fetchWorkspacesFromRBACBuildTree();
    }, 1000 * 60 * 10);

    return () => {
      clearInterval(timeout);
    };
  }, []);

  /**
   * Every time the workspaces tree changes, which will be signaled by React,
   * we need to rebuild the paths to the recently used workspaces.
   */
  React.useEffect(() => {
    if (!workspacesTree) {
      return;
    }

    // Turn the processed workspaces into raw workspaces, since the tree
    // structure changing might have probably changed the paths.
    const rawWorkspaces: Workspace[] = processedRecentlyUsedWorkspaces.map((pruw) => {
      return pruw.workspace;
    });

    // Find the paths for all the recently used workspaces.
    const recentlyUsedWorkspaces: RecentlyUsedWorkspace[] = FindPathForWorkspaces(workspacesTree, rawWorkspaces);

    // Update the state variable which contains all the recent workspaces.
    setProcessedRecentlyUsedWorkspaces(recentlyUsedWorkspaces);
  }, [workspacesTree]);

  /**
   * Handler which gets called when the user changes the selected workspace.
   * It updates the "selected workspace"'s state, the recently used workspace's
   * list if applicable, and also sends the recently used workspaces back to
   * Chrome so that they get saved in the principal's profile.
   * @param _ the fired event which gets ignored.
   * @param item the item that was selected.
   */
  const onSelectTreeViewWorkspaceItem = (_: React.MouseEvent, selectedItem: TreeViewDataItem) => {
    if (!instanceOfTreeViewWorkspaceItem(selectedItem)) {
      return;
    }

    // Update the state variable which contains the selected workspace.
    setSelectedWorkspace(selectedItem);

    // First attempt finding it in our processed workspaces which already have
    // paths. If it is there, we simply have to move it to the beginning of
    // the array. The index is there to help moving things around later.
    const index = processedRecentlyUsedWorkspaces.findIndex(function (pruw: RecentlyUsedWorkspace): boolean {
      return pruw.workspace.id === selectedItem.workspace.id;
    });

    // Make a copy of the list of already processed workspaces to not trigger
    // any state changes when moving things around in our list.
    const newRUWList = processedRecentlyUsedWorkspaces.slice();

    let recentlyUsedWorkspace: RecentlyUsedWorkspace;
    if (index != -1) {
      // When the user selects the same workspace as the first one that we have
      // on our recents list, we don't have to update our recents list or send
      // any requests to Chrome.
      if (newRUWList.length > 0 && newRUWList[0].workspace.id === selectedItem.id) {
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
      // we need to figure out its path in the tree.
      if (!workspacesTree) {
        return;
      }

      recentlyUsedWorkspace = FindPathForWorkspaces(workspacesTree, [selectedItem.workspace])[0];
    }

    // Insert the recently used element.
    newRUWList.unshift(recentlyUsedWorkspace);

    // Update the state for the "recently used workspaces" atom.
    setProcessedRecentlyUsedWorkspaces(newRUWList);

    // Attempt saving the recent workspaces in Chrome.
    const workspacesList: Workspace[] = newRUWList.map((ruw) => ({ ...ruw.workspace }));

    axios.post('/api/chrome-service/v1/recently-used-workspaces', workspacesList).catch((error) => {
      console.log('Unable to save the recently used workspaces in Chrome: %s', error);
    });
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
