export function clickReducer(state, action) {
    state = {
        ...state,
        previousPage: state.currentPage,
        currentPage: action.payload
    };
    return state;
}

export function globalNavReducer(state, action) {
    return {
        ...state,
        appId: action.data,
        globalNav: state.globalNav.map(item => ({
            ...item,
            active: item.id === action.data
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

export function loginReducer(state, { payload }) {
    return {
        ...state,
        user: payload
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
