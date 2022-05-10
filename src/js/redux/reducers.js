import { REQUESTS_COUNT, REQUESTS_DATA } from '../consts';
import { isBeta, highlightItems, isFedRamp, levelArray } from '../utils';

export function contextSwitcherBannerReducer(state) {
  state = {
    ...state,
    contextSwitcherOpen: !state.contextSwitcherOpen,
  };
  return state;
}

export function appNavClick(state, { payload }) {
  return {
    ...state,
    activeApp: payload.id,
  };
}

export function loginReducer(state, { payload }) {
  const missingIDP = isFedRamp() && !Object.prototype.hasOwnProperty.call(payload?.identity, 'idp');
  return {
    ...state,
    missingIDP,
    user: payload,
  };
}

export function onPageAction(state, { payload }) {
  return {
    ...state,
    pageAction: payload,
  };
}

export function onPageObjectId(state, { payload }) {
  return {
    ...state,
    pageObjectId: payload,
  };
}

export function onRegisterModule(state, { payload }) {
  const isModuleLoaded = state.modules[payload.module];
  if (!isModuleLoaded) {
    return {
      ...state,
      modules: {
        ...state.modules,
        [payload.module]: {
          manifestLocation: payload.manifestLocation || payload.manifest,
        },
      },
    };
  }

  return state;
}

export function loadNavigationLandingPageReducer(state, { payload }) {
  return {
    ...state,
    navigation: {
      ...state.navigation,
      landingPage: payload,
    },
  };
}

export function loadNavigationSegmentReducer(state, { payload: { segment, schema, pathName, shouldMerge } }) {
  const mergedSchema = shouldMerge || !state.navigation?.[segment] ? schema : state.navigation?.[segment];
  const sortedLinks = levelArray(mergedSchema.navItems).sort((a, b) => (a.length < b.length ? 1 : -1));
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

export function loadModulesSchemaReducer(state, { payload: { schema } }) {
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
  return {
    ...state,
    modules: schema,
    scalprumConfig,
  };
}

export function changeActiveModuleReducer(state, { payload }) {
  return {
    ...state,
    activeModule: payload,
    /**
     * @deprecated
     * App id is replaced by active module. It is still required until we completely remove usage of main.yml
     */
    appId: payload,
  };
}

export function setPendoFeedbackFlag(state, { payload }) {
  return {
    ...state,
    usePendoFeedback: payload,
  };
}

export function toggleFeedbackModal(state, { payload }) {
  return {
    ...state,
    isFeedbackModalOpen: payload,
  };
}

export function accessRequestsNotificationsReducer(state, { payload: { count, data } }) {
  const newData = data.map(({ request_id, created, seen }) => ({
    request_id,
    created,
    seen: seen === true || !!state.accessRequests.data.find((item) => request_id === item.request_id)?.seen || false,
  }));
  localStorage.setItem(REQUESTS_COUNT, newData.length);
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

export function markAccessRequestRequestReducer(state, { payload }) {
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

export function storeInitialHashReducer(state, { payload }) {
  const initialHash = typeof payload === 'string' ? payload.replace(/^#/, '') : undefined;
  return {
    ...state,
    initialHash,
  };
}

export function populateQuickstartsReducer(state, { payload: { app, quickstarts } }) {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      quickstarts: {
        ...state.quickstarts.quickstarts,
        [app]: quickstarts,
      },
    },
  };
}

export function disableQuickstartsReducer(state) {
  return {
    ...state,
    quickstarts: {
      ...state.quickstarts,
      disabled: true,
    },
  };
}

export function documentTitleReducer(state, { payload }) {
  return {
    ...state,
    documentTitle: payload,
  };
}

export function notificationsDrawerReducer(state) {
  return {
    ...state,
    isNotificationsDrawerOpen: !state.isNotificationsDrawerOpen,
  };
}

export function addNewNotificationReducer(state, { payload }) {
  return {
    ...state,
    notifications: [...(state.notifications || []), payload],
  };
}
