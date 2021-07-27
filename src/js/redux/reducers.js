import { isBeta } from '../utils';

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
  return {
    ...state,
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
