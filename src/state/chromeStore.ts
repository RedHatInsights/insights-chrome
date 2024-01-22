import { createStore } from 'jotai';
import { activeModuleAtom } from './atoms/activeModuleAtom';
import { contextSwitcherOpenAtom } from './atoms/contextSwitcher';

const chromeStore = createStore();

// setup initial chrome store state
chromeStore.set(contextSwitcherOpenAtom, false);
chromeStore.set(activeModuleAtom, undefined);

// globally handle subscription to activeModuleAtom
chromeStore.sub(activeModuleAtom, () => {
  // console.log('activeModule in store', chromeStore.get(activeModuleAtom));
});

export default chromeStore;
