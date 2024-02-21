import { createStore } from 'jotai';
import { activeModuleAtom } from './atoms/activeModuleAtom';
import { contextSwitcherOpenAtom } from './atoms/contextSwitcher';
import { gatewayErrorAtom } from './atoms/gatewayErrorAtom';

const chromeStore = createStore();

// setup initial chrome store state
chromeStore.set(contextSwitcherOpenAtom, false);
chromeStore.set(activeModuleAtom, undefined);
chromeStore.set(gatewayErrorAtom, undefined);

// globally handle subscription to activeModuleAtom
chromeStore.sub(activeModuleAtom, () => {
  // console.log('activeModule in store', chromeStore.get(activeModuleAtom));
});

export default chromeStore;
