import { atom } from 'jotai';

export const virtualAssistantOpenAtom = atom(false);
export const virtualAssistantStartInputAtom = atom<string | undefined>(undefined);
