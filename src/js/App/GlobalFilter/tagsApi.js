import instance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';
import { TagsApi } from '@redhat-cloud-services/host-inventory-client';
export const tags = new TagsApi(undefined, '/api/inventory/v1', instance);
import flatMap from 'lodash/flatMap';

/*

*/
export function getAllTags({ search, activeTags, registeredWith } = {}, pagination = {}) {
    console.log(activeTags, 'hu');
    let selectedTags;
    try {
        selectedTags = flatMap(
            Object.entries(activeTags),
            ([namespace, item]) => Object.entries(item)
            .filter(([, { isSelected }]) => isSelected && namespace !== 'Workloads')
            .map(([groupKey, { tagValue }]) => `${
                namespace ? `${namespace}/` : ''
            }${
                groupKey
            }${
                tagValue ? `=${tagValue}` : ''
            }`)
        );
    } catch (e) {
        selectedTags = undefined;
    }
    return tags.apiTagGetTags(
        selectedTags, // tag filer
        'tag',
        'ASC',
        (pagination && pagination.perPage) || 10,
        (pagination && pagination.page) || 1,
        undefined,
        search,
        registeredWith
    );
}
