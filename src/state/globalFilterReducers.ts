import groupBy from 'lodash/groupBy';
import { FlagTagsFilter } from '../@types/types';
import { AAP_KEY, MSSQL_KEY, SID_KEY } from '../components/GlobalFilter/globalFilterApi';
import { CommonTag, GlobalFilterState } from './store';

export const globalFilterDefaultState: GlobalFilterState = {
  scope: 'insights',
  tags: { isLoaded: false, items: [], count: 0, total: 0 },
  sid: { isLoaded: false, items: [], count: 0, total: 0 },
  workloads: {
    isLoaded: false,
    items: [],
    count: 0,
    total: 0,
    name: 'Workloads',
    noFilter: true,
    tags: [
      {
        tag: { key: 'SAP' },
        count: 0,
      },
      {
        tag: { key: AAP_KEY },
        count: 0,
      },
      {
        tag: { key: MSSQL_KEY },
        count: 0,
      },
    ],
  },
  selectedTags: {},
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

export function onTagSelect(state: GlobalFilterState, { payload }: { payload: FlagTagsFilter }): GlobalFilterState {
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
      ...state.workloads,
      isLoaded: true,
      tags: [
        {
          ...(state.workloads?.tags?.[0] || {}),
          count: SAP?.results?.find(({ value } = {}) => value)?.count || 0,
        },
        {
          ...(state.workloads?.tags?.[1] || {}),
          count: AAP?.total || 0,
        },
        {
          ...(state.workloads?.tags?.[2] || {}),
          count: MSSQL?.total || 0,
        },
      ],
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
