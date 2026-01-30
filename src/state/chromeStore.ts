import { createStore } from 'jotai';
import { activeModuleAtom } from './atoms/activeModuleAtom';
import { contextSwitcherOpenAtom } from './atoms/contextSwitcher';
import { isPreviewAtom } from './atoms/releaseAtom';
import { gatewayErrorAtom } from './atoms/gatewayErrorAtom';
import { isFeedbackModalOpenAtom } from './atoms/feedbackModalAtom';
import { activeAppAtom } from './atoms/activeAppAtom';
import { isDebuggerEnabledAtom } from './atoms/debuggerModalatom';
import { appActionAtom, pageObjectIdAtom } from './atoms/pageAtom';
import { moduleRoutesAtom } from './atoms/chromeModuleAtom';
import { drawerPanelContentAtom } from './atoms/drawerPanelContentAtom';
import { notificationDrawerExpandedAtom } from './atoms/notificationDrawerAtom';
import { segmentPageOptionsAtom } from './atoms/segmentPageOptionsAtom';
import { virtualAssistantShowAssistantAtom } from './atoms/virtualAssistantAtom';

const chromeStore = createStore();

// setup initial chrome store state
chromeStore.set(contextSwitcherOpenAtom, false);
chromeStore.set(activeModuleAtom, undefined);
chromeStore.set(isPreviewAtom, false);
chromeStore.set(gatewayErrorAtom, undefined);
chromeStore.set(isFeedbackModalOpenAtom, false);
// is set in bootstrap
chromeStore.set(activeAppAtom, undefined);
chromeStore.set(isDebuggerEnabledAtom, false);
// page actions
chromeStore.set(pageObjectIdAtom, undefined);
chromeStore.set(appActionAtom, undefined);
// routing configuration
chromeStore.set(moduleRoutesAtom, []);

chromeStore.set(drawerPanelContentAtom, undefined);
chromeStore.set(notificationDrawerExpandedAtom, false);

chromeStore.set(virtualAssistantShowAssistantAtom, false);

// analytics data
chromeStore.set(segmentPageOptionsAtom, {});

// globally handle subscription to activeModuleAtom
chromeStore.sub(activeModuleAtom, () => {
  // console.log('activeModule in store', chromeStore.get(activeModuleAtom));
});

export default chromeStore;
