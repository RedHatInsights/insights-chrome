import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/files/ReducerRegistry';

import {
    clickReducer,
    globalNavReducer,
    appNavClick,
    navToggleReducer,
    loginReducer,
    clearActive,
    navUpdateReducer,
    onPageAction,
    onPageObjectId,
    onGetAllTags,
    onGetAllTagsPending,
    onSetGlobalFilterScope
} from './reducers';
import {
    CLICK_ACTION,
    GLOBAL_NAV_IDENT,
    APP_NAV_CLICK,
    NAVIGATION_TOGGLE,
    USER_LOGIN,
    CLEAR_ACTIVE,
    CHROME_NAV_UPDATE,
    CHROME_PAGE_ACTION,
    CHROME_PAGE_OBJECT,
    CHROME_GET_ALL_TAGS,
    GLOBAL_FILTER_SCOPE
} from './action-types';

const reducers = {
    [CLEAR_ACTIVE]: clearActive,
    [CLICK_ACTION]: clickReducer,
    [GLOBAL_NAV_IDENT]: globalNavReducer,
    [APP_NAV_CLICK]: appNavClick,
    [NAVIGATION_TOGGLE]: navToggleReducer,
    [USER_LOGIN]: loginReducer,
    [CHROME_NAV_UPDATE]: navUpdateReducer,
    [CHROME_PAGE_ACTION]: onPageAction,
    [CHROME_PAGE_OBJECT]: onPageObjectId,
    [`${CHROME_GET_ALL_TAGS}_FULFILLED`]: onGetAllTags,
    [`${CHROME_GET_ALL_TAGS}_PENDING`]: onGetAllTagsPending,
    [GLOBAL_FILTER_SCOPE]: onSetGlobalFilterScope
};

export default function() {
    // const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

    return { chrome: (state = {}, action) => applyReducerHash(reducers)(state, action) };
}
