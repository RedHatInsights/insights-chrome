import selectOption from '../sidenav';

export function clickReducer(state, action) {
    state = {
        ...state,
        previousPage: state.currentPage,
        currentPage: action.payload
    };
    selectOption(action.payload);
    return state;
}