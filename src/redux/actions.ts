import * as actionTypes from './action-types';
import { getAllSIDs, getAllTags, getAllWorkloads } from '../components/GlobalFilter/tagsApi';
import type { TagFilterOptions, TagPagination } from '../components/GlobalFilter/tagsApi';
import type { ChromeUser } from '@redhat-cloud-services/types';
import type { FlagTagsFilter } from '../@types/types';

export function userLogIn(user: ChromeUser | boolean) {
  return {
    type: actionTypes.USER_LOGIN,
    payload: user,
  };
}

export type AppNavClickItem = { id?: string; custom?: boolean };

/*
 *TODO: The event type is deliberately nonse. It will start failing once we mirate rest of the app and we will figure out the correct type
 */

export function appAction(action: string) {
  return { type: actionTypes.CHROME_PAGE_ACTION, payload: action };
}

export function appObjectId(objectId: string) {
  return { type: actionTypes.CHROME_PAGE_OBJECT, payload: objectId };
}

export function fetchAllTags(filters?: TagFilterOptions, pagination?: TagPagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_TAGS,
    payload: getAllTags(filters, pagination),
  };
}

export function fetchAllSIDs(filters?: TagFilterOptions, pagination?: TagPagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_SIDS,
    payload: getAllSIDs(filters, pagination),
  };
}

export function fetchAllWorkloads(filters?: TagFilterOptions, pagination?: TagPagination) {
  return {
    type: actionTypes.CHROME_GET_ALL_WORKLOADS,
    payload: getAllWorkloads(filters, pagination),
  };
}

export function globalFilterScope(scope: string) {
  return {
    type: actionTypes.GLOBAL_FILTER_SCOPE,
    payload: scope,
  };
}

export function globalFilterChange(selectedTags: FlagTagsFilter) {
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

/**
 * @deprecated
 */
export const onToggle = () => ({
  type: 'NAVIGATION_TOGGLE',
});

export const markActiveProduct = (product?: string) => ({
  type: actionTypes.MARK_ACTIVE_PRODUCT,
  payload: product,
});
