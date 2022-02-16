import groupBy from 'lodash/groupBy';
export const SID_KEY = 'SAP ID (SID)';
export const AAP_KEY = 'Ansible Automation Platform';
export const MSSQL_KEY = 'Microsoft SQL';

export const globalFilterDefaultState = {
  scope: 'insights',
  tags: { isLoaded: false, items: [], count: 0, total: 0 },
  sid: { isLoaded: false, items: [], count: 0, total: 0 },
  workloads: { isLoaded: false, items: [], count: 0, total: 0, hasSap: 0, hasAap: 0, hasMssql: 0 },
};

export function onGetAllTags(state, { payload }) {
  return {
    ...state,
    tags: {
      isLoaded: true,
      items: Object.entries(groupBy(payload?.results || [], ({ tag: { namespace } }) => namespace)).map(([key, value]) => ({
        name: key,
        tags: value,
      })),
      total: payload?.total,
      count: payload?.count,
      page: payload?.page,
      // eslint-disable-next-line camelcase
      perPage: payload?.per_page,
    },
  };
}

export function onGetAllTagsPending(state) {
  return {
    ...state,
    tags: {
      ...state.tags,
      isLoaded: false,
    },
  };
}

export function onSetGlobalFilterScope(state, { payload }) {
  return {
    ...state,
    scope: payload,
  };
}

export function onGlobalFilterToggle(state, { payload }) {
  return {
    ...state,
    globalFilterHidden: payload.isHidden,
  };
}

export function onTagSelect(state, { payload }) {
  return {
    ...state,
    selectedTags: payload,
  };
}

export function onGetAllSIDs(state, { payload }) {
  return {
    ...state,
    sid: {
      isLoaded: true,
      ...(payload?.total > 0 && {
        items: [
          {
            name: SID_KEY,
            tags: (payload?.results || []).map(({ value, count } = {}) => ({
              tag: { key: value, namespace: SID_KEY },
              count,
            })),
          },
        ],
      }),
      total: payload?.total,
      count: payload?.count,
      page: payload?.page,
      // eslint-disable-next-line camelcase
      perPage: payload?.per_page,
    },
  };
}

export function onGetAllSIDsPending(state) {
  return {
    ...state,
    sid: {
      ...state.sid,
      isLoaded: false,
    },
  };
}

export function onGetAllWorkloads(state, { payload }) {
  const { SAP, AAP, MSSQL } = payload || {};
  return {
    ...state,
    workloads: {
      isLoaded: true,
      hasSap: SAP?.results?.find(({ value } = {}) => value)?.count || 0,
      hasAap: AAP?.total || 0,
      hasMssql: MSSQL?.total || 0,
    },
  };
}

export function onGetAllWorkloadsPending(state) {
  return {
    ...state,
    workloads: {
      ...state.workloads,
      isLoaded: false,
    },
  };
}

export function onGlobalFilterRemove(state, { payload }) {
  return {
    ...state,
    globalFilterRemoved: payload.isHidden,
  };
}
