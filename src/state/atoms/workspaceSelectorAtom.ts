import { atom } from 'jotai';

export interface SelectedWorkspace {
  id: string;
  name: string;
}

export const selectedWorkspaceAtom = atom<SelectedWorkspace | undefined>(undefined);
