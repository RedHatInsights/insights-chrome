import { QuickStart } from '@patternfly/quickstarts';
import { ChromeUser } from '@redhat-cloud-services/types';
import { NavItem, Navigation } from '../@types/types';
import { ITLess, highlightItems, levelArray } from '../utils/common';
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

export function loadNavigationLandingPageReducer(state: ChromeState, { payload }: { payload: NavItem[] }): ChromeState {
  return {
    ...state,
    navigation: {
      ...state.navigation,
      landingPage: payload,
    },
  };
}

function isNavigation(nav?: Navigation | NavItem[]): nav is Navigation {
  return !Array.isArray(nav);
}

export function loadNavigationSegmentReducer(
  state: ChromeState,
  {
    payload: { segment, schema, pathName, shouldMerge },
  }: {
    payload: {
      segment: string;
      schema: Navigation;
      pathName: string;
      shouldMerge?: boolean;
    };
  }
): ChromeState {
  const mergedSchema = shouldMerge || !state.navigation?.[segment] ? schema : state.navigation?.[segment];
  if (isNavigation(mergedSchema)) {
    // Landing page navgation has different siganture
    const sortedLinks = levelArray(mergedSchema?.navItems).sort((a, b) => (a.length < b.length ? 1 : -1));
    return {
      ...state,
      navigation: {
        ...state.navigation,
        [segment]: {
          ...mergedSchema,
          navItems: pathName ? highlightItems(pathName, mergedSchema.navItems, sortedLinks) : mergedSchema.navItems,
          sortedLinks,
        },
      },
    };
  }
  return state;
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
