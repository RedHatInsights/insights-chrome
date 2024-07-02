import { NavDOMEvent } from '@redhat-cloud-services/types';
import { atom } from 'jotai';

export type NavEvent = { navId?: string; domEvent: NavDOMEvent };
export type NavListener = (navEvent: NavEvent) => void;

export const activeAppAtom = atom<string | undefined>(undefined);
export const activeNavListenersAtom = atom<{ [listenerId: number]: NavListener | undefined }>({});
export const addNavListenerAtom = atom(null, (_get, set, navListener: NavListener) => {
  const listenerId = Date.now();
  set(activeNavListenersAtom, (prev) => {
    return { ...prev, [listenerId]: navListener };
  });
  return listenerId;
});
export const deleteNavListenerAtom = atom(null, (get, set, id: number) => {
  set(activeNavListenersAtom, (prev) => {
    return { ...prev, [id]: undefined };
  });
});

export const triggerNavListenersAtom = atom(null, (get, _set, event: NavEvent) => {
  const activeNavListeners = get(activeNavListenersAtom);
  Object.values(activeNavListeners).forEach((el) => {
    el?.(event);
  });
});
