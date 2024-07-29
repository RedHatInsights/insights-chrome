import { QuickStart } from '@patternfly/quickstarts';
import { ChromeUser } from '@redhat-cloud-services/types';
import { ITLess } from '../utils/common';
import { ChromeState } from './store';

export function loginReducer(state: ChromeState, { payload }: { payload: ChromeUser }): ChromeState {
  const missingIDP = ITLess() && !Object.prototype.hasOwnProperty.call(payload?.identity, 'idp');
  return {
    ...state,
    missingIDP,
  };
}

export function onPageAction(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    pageAction: payload,
  };
}

export function onPageObjectId(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    pageObjectId: payload,
  };
}

export function populateQuickstartsReducer(
  state: ChromeState,
  { payload: { app, quickstarts } }: { payload: { app: string; quickstarts: QuickStart[] } }
): ChromeState {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      quickstarts: {
        [app]: quickstarts,
      },
    },
  };
}

export function addQuickstartstoApp(state: ChromeState, { app, quickstart }: { app: string; quickstart: QuickStart }) {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      quickstarts: {
        ...state.quickstarts.quickstarts,
        [app]: [...(state.quickstarts?.quickstarts?.[app] ? state.quickstarts?.quickstarts?.[app] || [] : []), quickstart],
      },
    },
  };
}

export function disableQuickstartsReducer(state: ChromeState): ChromeState {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      disabled: true,
    },
  };
}

export function clearQuickstartsReducer(
  state: ChromeState,
  { payload: { activeQuickstart } }: { payload: { activeQuickstart?: string } }
): ChromeState {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      // do not remove currently opened quickstart
      quickstarts: Object.entries(state.quickstarts.quickstarts)?.reduce(
        (acc, [namespace, quickstarts]) => ({
          ...acc,
          [namespace]: Array.isArray(quickstarts) ? quickstarts.filter((qs) => qs?.metadata?.name === activeQuickstart) : quickstarts,
        }),
        {}
      ),
    },
  };
}

export function documentTitleReducer(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    documentTitle: payload,
  };
}

export function markActiveProduct(state: ChromeState, { payload }: { payload?: string }): ChromeState {
  return {
    ...state,
    activeProduct: payload,
  };
}
