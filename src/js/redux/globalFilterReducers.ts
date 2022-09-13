import groupBy from 'lodash/groupBy';
import { CommonTag, GlobalFilterState } from './store';
export const SID_KEY = 'SAP ID (SID)';
export const AAP_KEY = 'Ansible Automation Platform';
export const MSSQL_KEY = 'Microsoft SQL';

export const globalFilterDefaultState: GlobalFilterState = {
  scope: 'insights',
  tags: { isLoaded: false, items: [], count: 0, total: 0 },
  sid: { isLoaded: false, items: [], count: 0, total: 0 },
  workloads: { isLoaded: false, items: [], count: 0, total: 0, hasSap: 0, hasAap: 0, hasMssql: 0 },
  selectedTags: [],
  globalFilterHidden: false,
};

export function onGetAllTags(
  state: GlobalFilterState,
  {
    payload,
  }: {
    payload: {
      results?: { tag: CommonTag }[];
      total?: number;
      count?: number;
      page?: number;
      per_page?: number;
    };
  }
): GlobalFilterState {
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

export function onGetAllTagsPending(state: GlobalFilterState): GlobalFilterState {
  return {
    ...state,
    tags: {
      ...state.tags,
      isLoaded: false,
    },
  };
}

export function onSetGlobalFilterScope(state: GlobalFilterState, { payload }: { payload?: 'insights' }): GlobalFilterState {
  return {
    ...state,
    scope: payload,
  };
}

export function onGlobalFilterToggle(state: GlobalFilterState, { payload }: { payload: { isHidden: boolean } }): GlobalFilterState {
  return {
    ...state,
    globalFilterHidden: payload.isHidden,
  };
}

export function onTagSelect(state: GlobalFilterState, { payload }: { payload: unknown }): GlobalFilterState {
  return {
    ...state,
    selectedTags: payload,
  };
}

type OnGetAllSIDsPayload = {
  total: number;
  count: number;
  page: number;
  per_page: number;
  results: {
    value?: string;
    count?: number;
  }[];
};

export function onGetAllSIDs(state: GlobalFilterState, { payload }: { payload: OnGetAllSIDsPayload }): GlobalFilterState {
  return {
    ...state,
    sid: {
      isLoaded: true,
      ...(payload?.total > 0
        ? {
            items: [
              {
                name: SID_KEY,
                tags: (payload?.results || []).map(({ value, count } = {}) => ({
                  tag: { key: value, namespace: SID_KEY },
                  count,
                })),
              },
            ],
          }
        : {}),
      total: payload?.total,
      count: payload?.count,
      page: payload?.page,
      // eslint-disable-next-line camelcase
      perPage: payload?.per_page,
    },
  };
}

export function onGetAllSIDsPending(state: GlobalFilterState): GlobalFilterState {
  return {
    ...state,
    sid: {
      ...state.sid,
      isLoaded: false,
    },
  };
}

type OnGetAllWorkloadsPayload = {
  SAP?: {
    results?: {
      count?: number;
      value?: number;
    }[];
  };
  AAP?: {
    total?: number;
  };
  MSSQL?: {
    total?: number;
  };
};
export function onGetAllWorkloads(state: GlobalFilterState, { payload = {} }: { payload?: OnGetAllWorkloadsPayload }): GlobalFilterState {
  const { SAP, AAP, MSSQL } = payload;
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

export function onGetAllWorkloadsPending(state: GlobalFilterState): GlobalFilterState {
  return {
    ...state,
    workloads: {
      ...state.workloads,
      isLoaded: false,
    },
  };
}

export function onGlobalFilterRemove(state: GlobalFilterState, { payload }: { payload: { isHidden: boolean } }): GlobalFilterState {
  return {
    ...state,
    globalFilterRemoved: payload.isHidden,
  };
}
