import { getEnv, isBeta } from '../utils';

export function clickReducer(state, action) {
  state = {
    ...state,
    previousPage: state.currentPage,
    currentPage: action.payload,
  };
  return state;
}

export function contextSwitcherBannerReducer(state) {
  state = {
    ...state,
    contextSwitcherOpen: !state.contextSwitcherOpen,
  };
  return state;
}

export function globalNavReducer(state, { data: { id, activeApp } }) {
  const activeGroup = state.globalNav ? state.globalNav.filter((item) => item.group === id) : [];
  let active;
  if (activeGroup.length > 0) {
    active = activeGroup.find((item) => window.location.href.indexOf(item.id) !== -1);
  } else {
    active = { id };
  }

  return {
    ...state,
    appId: id,
    activeGroup: activeApp,
    navHidden: (id === 'landing' && getEnv() === 'ci' && isBeta()) || id === 'trust' || !state.user,
    globalNav:
      state.globalNav &&
      state.globalNav.map((item) => ({
        ...item,
        active: active && (item.id === active.id || item.title === active.id),
      })),
  };
}

export function navUpdateReducer(state, { payload: { activeSection, globalNav, ...payload } }) {
  return {
    ...state,
    ...payload,
    activeSection,
    globalNav: globalNav
      ? globalNav.map((app) => ({
          ...app,
          active: activeSection && (app.title === activeSection.title || app.id === activeSection.id),
        }))
      : state.globalNav,
  };
}

export function navUpdateSection(state, { payload }) {
  if (!payload) {
    return state;
  }
  return {
    ...state,
    activeSection: payload,
  };
}

export function appNavReducer(state, action) {
  return {
    ...state,
    appNav: action.data,
  };
}

export function appNavClick(state, { payload }) {
  const activeId = payload.id !== undefined ? payload.id : state.activeApp;
  const activeTitle = payload.title || state.activeAppTitle;
  return {
    ...state,
    activeApp: activeId,
    activeAppTitle: activeTitle,
    globalNav: payload.custom
      ? state?.globalNav?.map((item) => ({
          ...item,
          active:
            (payload && (item.id === activeId || item.title === activeId)) ||
            (item.subItems && item.subItems.some(({ id }) => id === activeId) && (item.id === state.appId || item.id === payload.parentId)),
        }))
      : state.globalNav,
  };
}

export function clearActive(state) {
  return {
    ...state,
    globalNav:
      state.globalNav &&
      state.globalNav.map((item) => ({
        ...item,
        active: false,
      })),
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
