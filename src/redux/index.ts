import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';

import {
  accessRequestsNotificationsReducer,
  addQuickstartstoApp,
  appNavClick,
  changeActiveModuleReducer,
  clearQuickstartsReducer,
  contextSwitcherBannerReducer,
  disableQuickstartsReducer,
  documentTitleReducer,
  loadModulesSchemaReducer,
  loadNavigationLandingPageReducer,
  loadNavigationSegmentReducer,
  loginReducer,
  markAccessRequestRequestReducer,
  markActiveProduct,
  onPageAction,
  onPageObjectId,
  onRegisterModule,
  populateQuickstartsReducer,
  setGatewayError,
  setPendoFeedbackFlag,
  toggleDebuggerButton,
  toggleDebuggerModal,
  toggleFeedbackModal,
} from './chromeReducers';
import {
  globalFilterDefaultState,
  onGetAllSIDs,
  onGetAllSIDsPending,
  onGetAllTags,
  onGetAllTagsPending,
  onGetAllWorkloads,
  onGetAllWorkloadsPending,
  onGlobalFilterRemove,
  onGlobalFilterToggle,
  onSetGlobalFilterScope,
  onTagSelect,
} from './globalFilterReducers';
import {
  ADD_QUICKSTARTS_TO_APP,
  APP_NAV_CLICK,
  CHANGE_ACTIVE_MODULE,
  CHROME_GET_ALL_SIDS,
  CHROME_GET_ALL_TAGS,
  CHROME_GET_ALL_WORKLOADS,
  CHROME_PAGE_ACTION,
  CHROME_PAGE_OBJECT,
  CLEAR_QUICKSTARTS,
  DISABLE_QUICKSTARTS,
  GLOBAL_FILTER_REMOVE,
  GLOBAL_FILTER_SCOPE,
  GLOBAL_FILTER_TOGGLE,
  GLOBAL_FILTER_UPDATE,
  LOAD_LEFT_NAVIGATION_SEGMENT,
  LOAD_MODULES_SCHEMA,
  LOAD_NAVIGATION_LANDING_PAGE,
  MARK_ACTIVE_PRODUCT,
  MARK_REQUEST_NOTIFICATION_SEEN,
  POPULATE_QUICKSTARTS_CATALOG,
  REGISTER_MODULE,
  SET_GATEWAY_ERROR,
  SET_PENDO_FEEDBACK_FLAG,
  TOGGLECONTEXTSWITCHER,
  TOGGLE_DEBUGGER_BUTTON,
  TOGGLE_DEBUGGER_MODAL,
  TOGGLE_FEEDBACK_MODAL,
  UPDATE_ACCESS_REQUESTS_NOTIFICATIONS,
  UPDATE_DOCUMENT_TITLE_REDUCER,
  USER_LOGIN,
} from './action-types';
import { ChromeState, GlobalFilterState, ReduxState } from './store';
import { AnyAction } from 'redux';

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
  [TOGGLE_DEBUGGER_MODAL]: toggleDebuggerModal,
  [TOGGLE_DEBUGGER_BUTTON]: toggleDebuggerButton,
  [UPDATE_ACCESS_REQUESTS_NOTIFICATIONS]: accessRequestsNotificationsReducer,
  [MARK_REQUEST_NOTIFICATION_SEEN]: markAccessRequestRequestReducer,
  [POPULATE_QUICKSTARTS_CATALOG]: populateQuickstartsReducer,
  [ADD_QUICKSTARTS_TO_APP]: addQuickstartstoApp,
  [DISABLE_QUICKSTARTS]: disableQuickstartsReducer,
  [UPDATE_DOCUMENT_TITLE_REDUCER]: documentTitleReducer,
  [MARK_ACTIVE_PRODUCT]: markActiveProduct,
  [SET_GATEWAY_ERROR]: setGatewayError,
  [CLEAR_QUICKSTARTS]: clearQuickstartsReducer,
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

export const chromeInitialState: ReduxState = {
  chrome: {
    contextSwitcherOpen: false,
    navigation: {},
    accessRequests: {
      hasUnseen: false,
      count: 0,
      data: [],
    },
    quickstarts: {
      quickstarts: {},
    },
    moduleRoutes: [],
  },
  globalFilter: globalFilterDefaultState,
};

export default function (): {
  chrome: (state: ChromeState, action: AnyAction) => ChromeState;
  globalFilter: (state: GlobalFilterState, action: AnyAction) => ChromeState;
} {
  // const chromeInitialState = JSON.parse(localStorage.getItem('chrome')) || {};

  return {
    chrome: (
      state = {
        navigation: {},
        accessRequests: {
          count: 0,
          data: [],
          hasUnseen: false,
        },
        quickstarts: {
          quickstarts: {},
        },
        contextSwitcherOpen: false,
        modules: {},
        scalprumConfig: {},
        moduleRoutes: [],
      },
      action
    ) => applyReducerHash(reducers)(state, action),
    globalFilter: (state = globalFilterDefaultState, action) => applyReducerHash(globalFilter)(state, action),
  };
}
