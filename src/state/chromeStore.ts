import { createStore } from 'jotai';
import { activeAppAtom } from './atoms/activeAppAtom';
import { activeModuleAtom } from './atoms/activeModuleAtom';
import { moduleRoutesAtom } from './atoms/chromeModuleAtom';
import { contextSwitcherOpenAtom } from './atoms/contextSwitcher';
import { isDebuggerEnabledAtom } from './atoms/debuggerModalatom';
import { drawerPanelContentAtom } from './atoms/drawerPanelContentAtom';
import { isFeedbackModalOpenAtom } from './atoms/feedbackModalAtom';
import { gatewayErrorAtom } from './atoms/gatewayErrorAtom';
import { notificationDrawerExpandedAtom } from './atoms/notificationDrawerAtom';
import { appActionAtom, pageObjectIdAtom } from './atoms/pageAtom';
import { isPreviewAtom } from './atoms/releaseAtom';
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
} from './atoms/workspacesAtom';

const chromeStore = createStore();

// setup initial chrome store state
chromeStore.set(contextSwitcherOpenAtom, false);
chromeStore.set(activeModuleAtom, undefined);
chromeStore.set(isPreviewAtom, false);
chromeStore.set(gatewayErrorAtom, undefined);
chromeStore.set(isFeedbackModalOpenAtom, false);
// is set in bootstrap
chromeStore.set(isPreviewAtom, false);
chromeStore.set(activeAppAtom, undefined);
chromeStore.set(isDebuggerEnabledAtom, false);
// page actions
chromeStore.set(pageObjectIdAtom, undefined);
chromeStore.set(appActionAtom, undefined);
// routing configuration
chromeStore.set(moduleRoutesAtom, []);

chromeStore.set(drawerPanelContentAtom, undefined);
chromeStore.set(notificationDrawerExpandedAtom, false);

// Workspaces
chromeStore.set(fetchedWorkspaces, []);
chromeStore.set(isFecthingRecentlyUsedWorkspaces, false);
chromeStore.set(isFecthingRecentlyUsedWorkspacesError, false);
chromeStore.set(isFetchingWorkspacesFromRBAC, false);
chromeStore.set(isFetchingWorkspacesFromRBACError, false);
chromeStore.set(isWorkspacesMenuExpanded, false);
chromeStore.set(recentlyUsedWorkspaces, []);
chromeStore.set(selectedWorkspace, undefined);
chromeStore.set(workspaceTree, undefined);

// globally handle subscription to activeModuleAtom
chromeStore.sub(activeModuleAtom, () => {
  // console.log('activeModule in store', chromeStore.get(activeModuleAtom));
});

export default chromeStore;
