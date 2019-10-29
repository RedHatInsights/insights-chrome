export function clickReducer(state, action) {
    state = {
        ...state,
        previousPage: state.currentPage,
        currentPage: action.payload
    };
    return state;
}

export function globalNavReducer(state, { data: { id, activeApp } }) {
    const activeGroup = state.globalNav.filter(item => item.group === id);
    let active;
    if (activeGroup.length > 0) {
        active = activeGroup.find(item => window.location.href.indexOf(item.id) !== -1);
    } else {
        active = { id };
    }

    return {
        ...state,
        appId: id,
        activeGroup: activeApp,
        navHidden: id === 'landing',
        globalNav: state.globalNav && state.globalNav.map(item => ({
            ...item,
            active: active && (item.id === active.id || item.title === active.id)
        }))
    };
}

export function navUpdateReducer(state, { payload }) {
    return {
        ...state,
        ...payload
    };
}

export function appNavReducer(state, action) {
    return {
        ...state,
        appNav: action.data
    };
}

export function appNavClick(state, { payload }) {
    return {
        ...state,
        activeApp: payload.id,
        globalNav: payload.custom ? state.globalNav && state.globalNav.map(item => ({
            ...item,
            active: payload && (item.id === payload.id || item.title === payload.id)
                || (item.subItems && item.subItems.some(({ id }) => id === payload.id))
        })) : state.globalNav
    };
}

export function clearActive(state) {
    return {
        ...state,
        globalNav: state.globalNav && state.globalNav.map(item => ({
            ...item,
            active: false
        }))
    };
}

export function navToggleReducer(state) {
    const mq = window.matchMedia('(min-width: 768px)');
    let page = document.getElementById('ins-c-sidebar');

    if (mq.matches) {
        page.classList.remove('pf-m-expanded');
        page.classList.toggle('pf-m-collapsed');
    } else {
        page.classList.remove('pf-m-collapsed');
        page.classList.toggle('pf-m-expanded');
    }

    return {
        ...state,
        navCollapse: !state.navCollapse
    };
}

export function loginReducer(state, { payload }) {
    return {
        ...state,
        user: payload
    };
}

export function onPageAction(state, { payload }) {
    return {
        ...state,
        pageAction: payload
    };
}

export function onPageObjectId(state, { payload }) {
    return {
        ...state,
        pageObjectId: payload
    };
}
