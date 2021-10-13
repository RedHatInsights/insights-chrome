import { REQUESTS_COUNT, REQUESTS_DATA } from '../consts';
import { isBeta, isFedRamp } from '../utils';

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
  /**
   * Flip the condition
   */
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

export function loadNavigationSegmentReducer(state, { payload: { segment, schema } }) {
  return {
    ...state,
    navigation: {
      ...state.navigation,
      [segment]: schema,
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
        manifestLocation: `${window.location.origin}${isBeta() ? '/beta' : ''}${config.manifestLocation}`,
      },
    }),
    {
      chrome: {
        name: 'chrome',
        manifestLocation: `${window.location.origin}${isBeta() ? '/beta' : ''}/apps/chrome/js/fed-mods.json`,
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
