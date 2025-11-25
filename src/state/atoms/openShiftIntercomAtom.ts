import { atom } from 'jotai';

export const openShiftIntercomExpandedAtom = atom(false);

export const toggleOpenShiftIntercomAtom = atom(
  null,
  (get, set) => {
    set(openShiftIntercomExpandedAtom, !get(openShiftIntercomExpandedAtom));
  }
);

// listens for onHide and onShow functions to keep chrome state proper
export const intercomModuleManagerAtom = atom(
  null,
  (get, set, { updatePositionCallback: updatePosition }: { updatePositionCallback?: () => void } = {}) => {
    if (!window.Intercom) {
      return;
    }

    const handleIntercomHide = () => {
      set(openShiftIntercomExpandedAtom, false);
      updatePosition?.();
    };

    const handleIntercomShow = () => {
      set(openShiftIntercomExpandedAtom, true);
    };

    // Register event handlers with Intercom
    window.Intercom('onHide', handleIntercomHide);
    window.Intercom('onShow', handleIntercomShow);
  }
);

// Atom to handle Intercom module show/hide actions
export const intercomModuleActionAtom = atom(
  null,
  (get, set, { action, updatePositionCallback: updatePosition }: { action: 'show' | 'hide'; updatePositionCallback?: () => void }) => {
    if (!window.Intercom) {
      console.warn('Intercom module not available. Using fallback toggle.');
      set(toggleOpenShiftIntercomAtom);
      return;
    }

    if (action === 'hide') {
      window.Intercom('hide');
    } else {
      updatePosition?.();
      window.Intercom('show');
    }
  }
);
