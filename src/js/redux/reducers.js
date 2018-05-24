import selectOption from '../sidenav';

export function clickReducer(state, action) {
    state = {
        ...state,
        previousPage: state.currentPage,
        currentPage: action.payload
    };
    localStorage.setItem('chrome', JSON.stringify(state));
    selectOption(action.payload);
    return state;
}