
import groupBy from 'lodash/groupBy';

export const defaultState = {
    tags: { isLoaded: false, items: [] },
    sid: { isLoaded: false, items: [] },
    workloads: { isLoaded: false, items: {} }
};

export function onGetAllTags(state, { payload }) {
    return {
        ...state,
        tags: {
            isLoaded: true,
            items: Object.entries(groupBy(payload?.results || [], ({ tag: { namespace } }) => namespace)).map(([key, value]) => ({
                name: key,
                tags: value
            })),
            total: payload?.total,
            count: payload?.count,
            page: payload?.page,
            // eslint-disable-next-line camelcase
            perPage: payload?.per_page
        }
    };
}

export function onGetAllTagsPending(state) {
    return {
        ...state,
        tags: {
            isLoaded: false
        }
    };
}

export function onSetGlobalFilterScope(state, { payload }) {
    return {
        ...state,
        scope: payload
    };
}

export function onGlobalFilterToggle(state, { payload }) {
    return {
        ...state,
        globalFilterHidden: payload.isHidden
    };
}

export function onTagSelect(state, { payload }) {
    return {
        ...state,
        selectedTags: payload
    };
}

export function onGetAllSIDs(state, { payload }) {
    return {
        ...state,
        sid: {
            isLoaded: true,
            items: [{
                name: 'SID',
                tags: (payload?.results || []).map(({ value, count } = {}) => ({
                    tag: { key: value },
                    count
                }))
            }],
            total: payload?.total,
            count: payload?.count,
            page: payload?.page,
            // eslint-disable-next-line camelcase
            perPage: payload?.per_page
        }
    };
}

export function onGetAllSIDsPending(state) {
    return {
        ...state,
        sid: {
            isLoaded: false
        }
    };
}

export function onGetAllWorkloads(state, { payload }) {
    return {
        ...state,
        workloads: {
            isLoaded: true,
            hasSap: payload?.results?.find(({ value } = {}) => value)?.count || 0
        }
    };
}

export function onGetAllWorkloadsPending(state) {
    return {
        ...state,
        workloads: {
            isLoaded: false
        }
    };
}
