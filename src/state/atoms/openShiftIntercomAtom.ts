import { atom } from 'jotai';

export const openShiftIntercomExpandedAtom = atom(false);

export const toggleOpenShiftIntercomAtom = atom(
  null,
  (get, set) => {
    set(openShiftIntercomExpandedAtom, !get(openShiftIntercomExpandedAtom));
  }
);
