import { atomWithToggle } from './utils';

/**
 * Atom to track if quickstarts are disabled.
 * This can be used to show a fallback UI when quickstarts fail to load.
 */
export const quickstartsDisabledAtom = atomWithToggle(false);
