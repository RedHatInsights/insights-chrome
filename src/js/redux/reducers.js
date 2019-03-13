export function clickReducer(state, action) {
    state = {
        ...state,
        previousPage: state.currentPage,
        currentPage: action.payload
    };
    return state;
}

export function globalNavReducer(state, action) {
    const activeGroup = state.globalNav.filter(item => item.group === action.data);
    let active;
    if (activeGroup.length > 0) {
        active = activeGroup.find(item => window.location.href.indexOf(item.id) !== -1);
    } else {
        active = { id: action.data };
    }

    return {
        ...state,
        appId: action.data,
        navHidden: action.data === 'landing',
        globalNav: state.globalNav && state.globalNav.map(item => ({
            ...item,
            active: active && item.id === active.id
        }))
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
        activeApp: payload.id
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
