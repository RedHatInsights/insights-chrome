import * as actionTypes from './action-types';
import { getAllTags, getAllSIDs, getAllWorkloads } from '../App/GlobalFilter/tagsApi';

export const userLogIn = (user) => ({
  type: actionTypes.USER_LOGIN,
  payload: user,
});

export function appNavClick(item, event) {
  return { type: actionTypes.APP_NAV_CLICK, payload: { ...(item || {}), id: item && item.id, event } };
}

export function appAction(action) {
  return { type: actionTypes.CHROME_PAGE_ACTION, payload: action };
}

export function appObjectId(objectId) {
  return { type: actionTypes.CHROME_PAGE_OBJECT, payload: objectId };
}

export function fetchAllTags(filters, pagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_TAGS,
    payload: getAllTags(filters, pagination),
  };
}

export function fetchAllSIDs(filters, pagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_SIDS,
    payload: getAllSIDs(filters, pagination),
  };
}

export function fetchAllWorkloads(filters, pagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_WORKLOADS,
    payload: getAllWorkloads(filters, pagination),
  };
}

export function globalFilterScope(scope) {
  return {
    type: actionTypes.GLOBAL_FILTER_SCOPE,
    payload: scope,
  };
}

export function globalFilterChange(selectedTags) {
  return {
    type: actionTypes.GLOBAL_FILTER_UPDATE,
    payload: selectedTags,
  };
}

export function toggleGlobalFilter(isHidden = true) {
  return {
    type: actionTypes.GLOBAL_FILTER_TOGGLE,
    payload: { isHidden },
  };
}

export function removeGlobalFilter(isHidden = true) {
  return {
    type: actionTypes.GLOBAL_FILTER_REMOVE,
    payload: { isHidden },
  };
}

export function registerModule(module, manifest) {
  if (!module) {
    throw new Error(`unknown module identifier: ${module}`);
  }
  return {
    type: actionTypes.REGISTER_MODULE,
    payload: {
      module,
      manifest,
    },
  };
}

export const onToggleContextSwitcher = () => ({
  type: actionTypes.TOGGLECONTEXTSWITCHER,
});

export const loadNavigationLandingPage = (schema) => ({
  type: actionTypes.LOAD_NAVIGATION_LANDING_PAGE,
  payload: schema,
});

export const loadLeftNavSegment = (schema, segment) => ({
  type: actionTypes.LOAD_LEFT_NAVIGATION_SEGMENT,
  payload: {
    segment,
    schema,
  },
});

export const loadModuesSchema = (schema) => ({
  type: actionTypes.LOAD_MODULES_SCHEMA,
  payload: {
    schema,
  },
});

export const changeActiveModule = (module) => ({
  type: actionTypes.CHANGE_ACTIVE_MODULE,
  payload: module,
});

/**
 * @deprecated
 */
export const onToggle = () => ({
  type: 'NAVIGATION_TOGGLE',
});

export const setPendoFeedbackFlag = (payload) => ({
  type: actionTypes.SET_PENDO_FEEDBACK_FLAG,
  payload,
});

export const toggleFeedbackModal = (payload) => ({
  type: actionTypes.TOGGLE_FEEDBACK_MODAL,
  payload,
});

export const updateAccessRequestsNotifications = (payload) => ({
  type: actionTypes.UPDATE_ACCESS_REQUESTS_NOTIFICATIONS,
  payload,
});

export const markAccessRequestNotification = (payload) => ({
  type: actionTypes.MARK_REQUEST_NOTIFICATION_SEEN,
  payload,
});

export const storeInitialHash = (payload) => ({
  type: actionTypes.STORE_INITIAL_HASH,
  payload,
});
