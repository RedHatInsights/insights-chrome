import { atom } from 'jotai';

export const virtualAssistantShowAssistantAtom = atom<boolean>(false);
export const virtualAssistantOpenAtom = atom<boolean>(false);
export const virtualAssistantStartInputAtom = atom<string | undefined>(undefined);
