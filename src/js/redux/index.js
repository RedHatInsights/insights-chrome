import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';

import {
  clickReducer,
  globalNavReducer,
  appNavClick,
  loginReducer,
  clearActive,
  navUpdateReducer,
  onPageAction,
  onPageObjectId,
  navUpdateSection,
  onRegisterModule,
  contextSwitcherBannerReducer,
  loadNavigationLandingPageReducer,
  loadNavigationSegmentReducer,
  loadModulesSchemaReducer,
  changeActiveModuleReducer,
} from './reducers';
import {
  onGetAllTags,
  onGetAllTagsPending,
  onSetGlobalFilterScope,
  onGlobalFilterToggle,
  onTagSelect,
  onGetAllSIDs,
  onGetAllSIDsPending,
  onGetAllWorkloads,
  onGetAllWorkloadsPending,
  onGlobalFilterRemove,
  globalFilterDefaultState,
} from './globalFilterReducers';
import {
  CLICK_ACTION,
  GLOBAL_NAV_IDENT,
  APP_NAV_CLICK,
  USER_LOGIN,
  CLEAR_ACTIVE,
  CHROME_NAV_UPDATE,
  CHROME_PAGE_ACTION,
  CHROME_PAGE_OBJECT,
  CHROME_GET_ALL_TAGS,
  CHROME_GET_ALL_SIDS,
  CHROME_GET_ALL_WORKLOADS,
  GLOBAL_FILTER_SCOPE,
  GLOBAL_FILTER_TOGGLE,
  GLOBAL_FILTER_UPDATE,
  GLOBAL_FILTER_REMOVE,
  CHROME_NAV_SECTION_UPDATE,
  REGISTER_MODULE,
  TOGGLECONTEXTSWITCHER,
  LOAD_NAVIGATION_LANDING_PAGE,
  LOAD_LEFT_NAVIGATION_SEGMENT,
  LOAD_MODULES_SCHEMA,
  CHANGE_ACTIVE_MODULE,
} from './action-types';

const reducers = {
  [CLEAR_ACTIVE]: clearActive,
  [CLICK_ACTION]: clickReducer,
  [GLOBAL_NAV_IDENT]: globalNavReducer,
  [APP_NAV_CLICK]: appNavClick,
  [USER_LOGIN]: loginReducer,
  [CHROME_NAV_UPDATE]: navUpdateReducer,
  [CHROME_NAV_SECTION_UPDATE]: navUpdateSection,
  [CHROME_PAGE_ACTION]: onPageAction,
  [CHROME_PAGE_OBJECT]: onPageObjectId,
  [REGISTER_MODULE]: onRegisterModule,
  [TOGGLECONTEXTSWITCHER]: contextSwitcherBannerReducer,
  [LOAD_NAVIGATION_LANDING_PAGE]: loadNavigationLandingPageReducer,
  [LOAD_LEFT_NAVIGATION_SEGMENT]: loadNavigationSegmentReducer,
  [LOAD_MODULES_SCHEMA]: loadModulesSchemaReducer,
  [CHANGE_ACTIVE_MODULE]: changeActiveModuleReducer,
};

const globalFilter = {
  [`${CHROME_GET_ALL_TAGS}_FULFILLED`]: onGetAllTags,
  [`${CHROME_GET_ALL_TAGS}_PENDING`]: onGetAllTagsPending,
  [`${CHROME_GET_ALL_SIDS}_FULFILLED`]: onGetAllSIDs,
  [`${CHROME_GET_ALL_SIDS}_PENDING`]: onGetAllSIDsPending,
  [`${CHROME_GET_ALL_WORKLOADS}_FULFILLED`]: onGetAllWorkloads,
  [`${CHROME_GET_ALL_WORKLOADS}_PENDING`]: onGetAllWorkloadsPending,
  [GLOBAL_FILTER_SCOPE]: onSetGlobalFilterScope,
  [GLOBAL_FILTER_TOGGLE]: onGlobalFilterToggle,
  [GLOBAL_FILTER_REMOVE]: onGlobalFilterRemove,
  [GLOBAL_FILTER_UPDATE]: onTagSelect,
};

export default function () {
  // const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

  return {
    chrome: (
      state = {
        navigation: {},
      },
      action
    ) => applyReducerHash(reducers)(state, action),
    globalFilter: (state = globalFilterDefaultState, action) => applyReducerHash(globalFilter)(state, action),
  };
}
