import { createSharedStore } from '@scalprum/core';
import { useGetState } from '@scalprum/react-core';

interface OpenShiftIntercomState {
  isExpanded: boolean;
}
const EVENTS = ['SHOW', 'HIDE', 'TOGGLE', 'INITIALIZE'] as const;

let store: ReturnType<typeof createSharedStore<OpenShiftIntercomState, typeof EVENTS>> | null = null;
export const getOpenShiftIntercomStore = () => {
  if (!store) {
    store = createSharedStore({
      initialState: { isExpanded: false } as OpenShiftIntercomState,
      events: EVENTS,
      onEventChange: (state, event): OpenShiftIntercomState => {
        switch (event) {
          case 'SHOW':
            return { isExpanded: true };
          case 'HIDE':
            return { isExpanded: false };
          case 'TOGGLE':
            return { isExpanded: !state.isExpanded };
          default:
            return state;
        }
      },
    });
  }
  return store;
};

export const useOpenShiftIntercomStore = () => {
  const store = getOpenShiftIntercomStore();
  const state = useGetState(store);

  return {
    isExpanded: state.isExpanded,
    show: () => store.updateState('SHOW'),
    hide: () => store.updateState('HIDE'),
    toggle: () => store.updateState('TOGGLE'),
    initialize: () => store.updateState('INITIALIZE'),
  };
};
