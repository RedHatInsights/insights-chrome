import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';

import {
  addQuickstartstoApp,
  clearQuickstartsReducer,
  disableQuickstartsReducer,
  documentTitleReducer,
  loginReducer,
  markActiveProduct,
  onPageAction,
  onPageObjectId,
  populateQuickstartsReducer,
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
  MARK_ACTIVE_PRODUCT,
  POPULATE_QUICKSTARTS_CATALOG,
  UPDATE_DOCUMENT_TITLE_REDUCER,
  USER_LOGIN,
} from './action-types';
import { ChromeState, GlobalFilterState, ReduxState } from './store';
import { AnyAction } from 'redux';

const reducers = {
  [USER_LOGIN]: loginReducer,
  [CHROME_PAGE_ACTION]: onPageAction,
  [CHROME_PAGE_OBJECT]: onPageObjectId,
  [POPULATE_QUICKSTARTS_CATALOG]: populateQuickstartsReducer,
  [ADD_QUICKSTARTS_TO_APP]: addQuickstartstoApp,
  [DISABLE_QUICKSTARTS]: disableQuickstartsReducer,
  [UPDATE_DOCUMENT_TITLE_REDUCER]: documentTitleReducer,
  [MARK_ACTIVE_PRODUCT]: markActiveProduct,
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
    quickstarts: {
      quickstarts: {},
    },
  },
  globalFilter: globalFilterDefaultState,
};

export default function (): {
  chrome: (state: ChromeState, action: AnyAction) => ChromeState;
  globalFilter: (state: GlobalFilterState, action: AnyAction) => ChromeState;
} {
  return {
    chrome: (
      state = {
        quickstarts: {
          quickstarts: {},
        },
      },
      action
    ) => applyReducerHash(reducers)(state, action),
    globalFilter: (state = globalFilterDefaultState, action) => applyReducerHash(globalFilter)(state, action),
  };
}
