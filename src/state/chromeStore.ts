import { createStore } from 'jotai';
import { activeModuleAtom } from './atoms/activeModuleAtom';
import { contextSwitcherOpenAtom } from './atoms/contextSwitcher';
import { isPreviewAtom } from './atoms/releaseAtom';
import { gatewayErrorAtom } from './atoms/gatewayErrorAtom';
import { isFeedbackModalOpenAtom } from './atoms/feedbackModalAtom';
import { activeAppAtom } from './atoms/activeAppAtom';
import { isDebuggerEnabledAtom } from './atoms/debuggerModalatom';
import { appActionAtom, pageObjectIdAtom } from './atoms/pageAtom';

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

// globally handle subscription to activeModuleAtom
chromeStore.sub(activeModuleAtom, () => {
  // console.log('activeModule in store', chromeStore.get(activeModuleAtom));
});

export default chromeStore;
