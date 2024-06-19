import { WritableAtom, atom } from 'jotai';

// recipe from https://jotai.org/docs/recipes/atom-with-toggle
export function atomWithToggle(initialValue?: boolean, onToggle?: (value: boolean) => void): WritableAtom<boolean, [boolean?], void> {
  const anAtom = atom(initialValue, (get, set, nextValue?: boolean) => {
    const update = nextValue ?? !get(anAtom);
    set(anAtom, update);
    onToggle?.(update);
  });

  return anAtom as WritableAtom<boolean, [boolean?], void>;
}
