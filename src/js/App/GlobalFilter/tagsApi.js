import instance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';
import { INVENTORY_API_BASE } from './constants';
import { TagsApi, SapSystemApi } from '@redhat-cloud-services/host-inventory-client';
export const tags = new TagsApi(undefined, INVENTORY_API_BASE, instance);
export const sap = new SapSystemApi(undefined, INVENTORY_API_BASE, instance);
import flatMap from 'lodash/flatMap';

const flatTags = (filter, encode = false, format = false) => {
    const { Workloads, SID, ...tags } = filter;
    const mappedTags = flatMap(
        Object.entries({ ...tags, ...!format && { Workloads, SID } } || {}),
        ([namespace, item]) => Object.entries(item)
        .filter(([, { isSelected }]) => isSelected)
        .map(([groupKey, { item, value: tagValue }]) => `${
                namespace ? `${encode ? encodeURIComponent(namespace) : namespace}/` : ''
            }${
                encode ? encodeURIComponent(groupKey) : groupKey
            }${
                (item?.tagValue || tagValue) ? `=${encode ? encodeURIComponent(item?.tagValue || tagValue) : item?.tagValue || tagValue}` : ''
            }`)
    );
    return format ? [
        Workloads,
        SID,
        mappedTags
    ] : mappedTags;
};

export function getAllTags({ search, activeTags, registeredWith } = {}, pagination = {}) {
    const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
    return tags.apiTagGetTags(
        selectedTags, // tag filer
        'tag',
        'ASC',
        (pagination && pagination.perPage) || 10,
        (pagination && pagination.page) || 1,
        undefined,
        search,
        registeredWith,
        undefined,
        {}
    );
}

export function getAllSIDs({ activeTags, registeredWith } = {}, pagination = {}) {
    const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

    return sap.apiSystemProfileGetSapSids(
        undefined, // tags
        (pagination && pagination.perPage) || 10,
        (pagination && pagination.page) || 1,
        undefined, // staleness,
        registeredWith,
        undefined,
        {}
    );
}

export function getAllWorkloads({ activeTags, registeredWith } = {}, pagination = {}) {
    const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

    return sap.apiSystemProfileGetSapSystem(
        undefined, // tags
        (pagination && pagination.perPage) || 10,
        (pagination && pagination.page) || 1,
        undefined, // staleness,
        registeredWith,
        undefined,
        {}
    );
}
