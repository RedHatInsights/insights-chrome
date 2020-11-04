import * as actionTypes from './action-types';
import { getAllTags, getAllSIDs, getAllWorkloads } from '../App/GlobalFilter/tagsApi';

export const onToggle = () => ({
  type: actionTypes.NAVIGATION_TOGGLE,
});

export const userLogIn = (user) => ({
  type: actionTypes.USER_LOGIN,
  payload: user,
});

export const clickAction = (data) => ({ type: actionTypes.CLICK_ACTION, payload: data });

function isCurrApp(item, app) {
  if (item.id === app) {
    return true;
  } else if (item.subItems && item.subItems.some((sub) => sub.id === app)) {
    return true;
  } else if (item.group === app && item.active) {
    return true;
  }

  return false;
}

export function identifyApp(data, options) {
  if (data === 'landing' || data === 'trust') {
    return { type: actionTypes.GLOBAL_NAV_IDENT, data: { id: data } };
  }

  if (!options.some((item) => isCurrApp(item, data))) {
    throw new Error(`unknown app identifier: ${data}`);
  }

  const firstLevel = options.find((item) => isCurrApp(item, data));

  return { type: actionTypes.GLOBAL_NAV_IDENT, data: { id: firstLevel.id || firstLevel.title, activeApp: data } };
}

export function appNavClick(item, event) {
  return { type: actionTypes.APP_NAV_CLICK, payload: { ...(item || {}), id: item && item.id, event } };
}

export function clearActive() {
  return {
    type: actionTypes.CLEAR_ACTIVE,
  };
}

export function chromeNavUpdate(newNav) {
  return { type: actionTypes.CHROME_NAV_UPDATE, payload: newNav };
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
