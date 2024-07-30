import * as actionTypes from './action-types';
import { getAllSIDs, getAllTags, getAllWorkloads } from '../components/GlobalFilter/tagsApi';
import type { TagFilterOptions, TagPagination } from '../components/GlobalFilter/tagsApi';
import type { FlagTagsFilter } from '../@types/types';

export type AppNavClickItem = { id?: string; custom?: boolean };

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
