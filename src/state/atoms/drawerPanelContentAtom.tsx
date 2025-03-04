import { atom } from 'jotai';
import { ScalprumComponentProps } from '@scalprum/react-core';

export const drawerPanelContentAtom = atom<(ScalprumComponentProps & { props?: Record<string, unknown> }) | undefined>(undefined);
