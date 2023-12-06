import { atom } from 'jotai';
// setup initial chrome atoms
export const contextSwitcherOpenAtom = atom(false);
export const activeModuleAtom = atom<string | undefined>(undefined);
