import { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';

import {
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
} from '../reducers/globalFilterReducers';
import {
  CHROME_GET_ALL_SIDS,
  CHROME_GET_ALL_TAGS,
  CHROME_GET_ALL_WORKLOADS,
  GLOBAL_FILTER_REMOVE,
  GLOBAL_FILTER_SCOPE,
  GLOBAL_FILTER_TOGGLE,
  GLOBAL_FILTER_UPDATE,
} from './globalFilterActionTypes';

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
