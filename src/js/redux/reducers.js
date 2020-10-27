export function clickReducer(state, action) {
  state = {
    ...state,
    previousPage: state.currentPage,
    currentPage: action.payload,
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
    navHidden: id === 'landing' || id === 'trust',
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
    globalNav: globalNav.map((app) => ({
      ...app,
      active: activeSection && (app.title === activeSection.title || app.id === activeSection.id),
    })),
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

export function navToggleReducer(state) {
  const mq = window.matchMedia && window.matchMedia('(min-width: 1200px)');
  let page = document.getElementById('ins-c-sidebar');

  if (mq && mq.matches) {
    page.classList.remove('pf-m-expanded');
    page.classList.toggle('pf-m-collapsed');
  } else {
    page && page.classList.remove('pf-m-collapsed');
    page && page.classList.toggle('pf-m-expanded');
  }

  return {
    ...state,
    navCollapse: !state.navCollapse,
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
