import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';

import {
  appNavClick,
  loginReducer,
  onPageAction,
  onPageObjectId,
  onRegisterModule,
  contextSwitcherBannerReducer,
  loadNavigationLandingPageReducer,
  loadNavigationSegmentReducer,
  loadModulesSchemaReducer,
  changeActiveModuleReducer,
  setPendoFeedbackFlag,
  toggleFeedbackModal,
  accessRequestsNotificationsReducer,
  markAccessRequestRequestReducer,
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
  APP_NAV_CLICK,
  USER_LOGIN,
  CHROME_PAGE_ACTION,
  CHROME_PAGE_OBJECT,
  CHROME_GET_ALL_TAGS,
  CHROME_GET_ALL_SIDS,
  CHROME_GET_ALL_WORKLOADS,
  GLOBAL_FILTER_SCOPE,
  GLOBAL_FILTER_TOGGLE,
  GLOBAL_FILTER_UPDATE,
  GLOBAL_FILTER_REMOVE,
  REGISTER_MODULE,
  TOGGLECONTEXTSWITCHER,
  LOAD_NAVIGATION_LANDING_PAGE,
  LOAD_LEFT_NAVIGATION_SEGMENT,
  LOAD_MODULES_SCHEMA,
  CHANGE_ACTIVE_MODULE,
  SET_PENDO_FEEDBACK_FLAG,
  TOGGLE_FEEDBACK_MODAL,
  UPDATE_ACCESS_REQUESTS_NOTIFICATIONS,
  MARK_REQUEST_NOTIFICATION_SEEN,
} from './action-types';

const reducers = {
  [APP_NAV_CLICK]: appNavClick,
  [USER_LOGIN]: loginReducer,
  [CHROME_PAGE_ACTION]: onPageAction,
  [CHROME_PAGE_OBJECT]: onPageObjectId,
  [REGISTER_MODULE]: onRegisterModule,
  [TOGGLECONTEXTSWITCHER]: contextSwitcherBannerReducer,
  [LOAD_NAVIGATION_LANDING_PAGE]: loadNavigationLandingPageReducer,
  [LOAD_LEFT_NAVIGATION_SEGMENT]: loadNavigationSegmentReducer,
  [LOAD_MODULES_SCHEMA]: loadModulesSchemaReducer,
  [CHANGE_ACTIVE_MODULE]: changeActiveModuleReducer,
  [SET_PENDO_FEEDBACK_FLAG]: setPendoFeedbackFlag,
  [TOGGLE_FEEDBACK_MODAL]: toggleFeedbackModal,
  [UPDATE_ACCESS_REQUESTS_NOTIFICATIONS]: accessRequestsNotificationsReducer,
  [MARK_REQUEST_NOTIFICATION_SEEN]: markAccessRequestRequestReducer,
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
        accessRequests: {
          count: 0,
          data: [],
        },
      },
      action
    ) => applyReducerHash(reducers)(state, action),
    globalFilter: (state = globalFilterDefaultState, action) => applyReducerHash(globalFilter)(state, action),
  };
}
