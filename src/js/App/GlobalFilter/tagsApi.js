/* eslint-disable camelcase */
import instance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';
import { flatTags, INVENTORY_API_BASE } from './constants';
import { TagsApi, SapSystemApi } from '@redhat-cloud-services/host-inventory-client';
import { generateFilter } from '@redhat-cloud-services/frontend-components-utilities/files/helpers';
export const tags = new TagsApi(undefined, INVENTORY_API_BASE, instance);
export const sap = new SapSystemApi(undefined, INVENTORY_API_BASE, instance);

export function getAllTags({ search, activeTags, registeredWith } = {}, pagination = {}) {
    const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
    const filter = {
        system_profile: {
            ...workloads?.SAP?.isSelected && { sap_system: true },
            sap_sids: SID
        }
    };
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
        {
            query: generateFilter(filter)
        }
    );
}

export function getAllSIDs({ activeTags, registeredWith } = {}, pagination = {}) {
    const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
    const filter = {
        system_profile: {
            ...workloads?.SAP?.isSelected && { sap_system: true },
            sap_sids: SID
        }
    };
    return sap.apiSystemProfileGetSapSids(
        selectedTags, // tags
        (pagination && pagination.perPage) || 10,
        (pagination && pagination.page) || 1,
        undefined, // staleness,
        registeredWith,
        undefined,
        {
            query: generateFilter(filter)
        }
    );
}

export function getAllWorkloads({ activeTags, registeredWith } = {}, pagination = {}) {
    const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

    const filter = {
        system_profile: {
            ...workloads?.SAP?.isSelected && { sap_system: true },
            sap_sids: SID
        }
    };
    console.log(filter, generateFilter(filter), 'ffffmmm');
    return sap.apiSystemProfileGetSapSystem(
        selectedTags, // tags
        (pagination && pagination.perPage) || 10,
        (pagination && pagination.page) || 1,
        undefined, // staleness,
        registeredWith,
        undefined,
        {
            query: generateFilter(filter)
        }
    );
}
