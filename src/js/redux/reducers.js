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
