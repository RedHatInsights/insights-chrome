import { QuickStart } from '@patternfly/quickstarts';
import { ChromeUser } from '@redhat-cloud-services/types';
import { REQUESTS_COUNT, REQUESTS_DATA } from '../utils/consts';
import { ChromeModule, NavItem, Navigation } from '../@types/types';
import { ITLess, generateRoutesList, highlightItems, isBeta, levelArray } from '../utils/common';
import { ThreeScaleError } from '../utils/responseInterceptors';
import { AccessRequest, ChromeState } from './store';

export function contextSwitcherBannerReducer(state: ChromeState): ChromeState {
  return {
    ...state,
    contextSwitcherOpen: !state.contextSwitcherOpen,
  };
}

export function appNavClick(state: ChromeState, { payload }: { payload: { id: string } }): ChromeState {
  return {
    ...state,
    activeApp: payload.id,
  };
}

export function loginReducer(state: ChromeState, { payload }: { payload: ChromeUser }): ChromeState {
  const missingIDP = ITLess() && !Object.prototype.hasOwnProperty.call(payload?.identity, 'idp');
  return {
    ...state,
    missingIDP,
    user: payload,
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

export function onRegisterModule(
  state: ChromeState,
  {
    payload,
  }: {
    payload: {
      module: string;
      manifestLocation?: string;
      manifest?: string;
    };
  }
): ChromeState {
  const isModuleLoaded = state.modules?.[payload.module];
  const manifestLocation = payload.manifestLocation || payload.manifest;
  if (!isModuleLoaded && typeof manifestLocation === 'string') {
    return {
      ...state,
      modules: {
        ...state.modules,
        [payload.module]: {
          manifestLocation,
        },
      },
    };
  }

  return state;
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

export function loadModulesSchemaReducer(
  state: ChromeState,
  {
    payload: { schema },
  }: {
    payload: {
      schema: {
        [key: string]: ChromeModule;
      };
    };
  }
): ChromeState {
  const scalprumConfig = Object.entries(schema).reduce(
    (acc, [name, config]) => ({
      ...acc,
      [name]: {
        name,
        module: `${name}#./RootApp`,
        manifestLocation: `${window.location.origin}${isBeta() ? '/beta' : ''}${config.manifestLocation}?ts=${Date.now()}`,
      },
    }),
    {
      chrome: {
        name: 'chrome',
        manifestLocation: `${window.location.origin}${isBeta() ? '/beta' : ''}/apps/chrome/js/fed-mods.json?ts=${Date.now()}`,
      },
    }
  );
  const moduleRoutes = generateRoutesList(schema);
  return {
    ...state,
    modules: schema,
    scalprumConfig,
    moduleRoutes,
  };
}

export function changeActiveModuleReducer(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    activeModule: payload,
    appId: payload,
  };
}

export function setPendoFeedbackFlag(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    usePendoFeedback: payload,
  };
}

export function toggleFeedbackModal(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    isFeedbackModalOpen: payload,
  };
}

export function toggleDebuggerModal(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    isDebuggerModalOpen: payload,
  };
}

export function toggleDebuggerButton(
  state: ChromeState,
  {
    payload,
  }: {
    payload: boolean;
  }
): ChromeState {
  return {
    ...state,
    isDebuggerEnabled: payload,
  };
}

export function accessRequestsNotificationsReducer(
  state: ChromeState,
  { payload: { count, data } }: { payload: { count: number; data: AccessRequest[] } }
): ChromeState {
  const newData = data.map(({ request_id, created, seen }) => ({
    request_id,
    created,
    seen: seen === true || !!state.accessRequests.data.find((item) => request_id === item.request_id)?.seen || false,
  }));
  localStorage.setItem(REQUESTS_COUNT, newData.length.toString());
  localStorage.setItem(REQUESTS_DATA, JSON.stringify(newData));
  return {
    ...state,
    accessRequests: {
      ...state.accessRequests,
      count,
      hasUnseen: newData.length > 0,
      data: newData,
    },
  };
}

export function markAccessRequestRequestReducer(state: ChromeState, { payload }: { payload: string }): ChromeState {
  const newData = state.accessRequests.data.map((item) => (item.request_id === payload ? { ...item, seen: true } : item));
  localStorage.setItem(REQUESTS_DATA, JSON.stringify(newData));
  return {
    ...state,
    accessRequests: {
      ...state.accessRequests,
      hasUnseen: newData.length > 0,
      data: newData,
    },
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

export function setGatewayError(state: ChromeState, { payload }: { payload?: ThreeScaleError }): ChromeState {
  return {
    ...state,
    gatewayError: payload,
  };
}
