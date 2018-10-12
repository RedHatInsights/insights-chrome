import * as globalNav from '../nav/globalNav';

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
        globalNav: globalNav.options.map(item => ({
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

export function appNavClick(state, action) {
    document.querySelectorAll('li:not(.pf-m-expanded) .pf-m-current').forEach(previousPage => {
        previousPage.classList.remove('pf-m-current');
    });
    action.payload.event.target.classList.add('pf-m-current');
    return {
        ...state,
        activeApp: action.payload.id
    };
}
