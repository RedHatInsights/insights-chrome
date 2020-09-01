import { deleteLocalStorageItems } from '../../utils';
export const GLOBAL_FILTER_KEY = 'chrome:global-filter';

export const workloads = [
    {
        name: 'Workloads',
        noFilter: true,
        tags: [{
            tag: { key: 'All workloads' }
        },
        {
            tag: { key: 'SAP' }
        },
        {
            tag: { key: 'SQL' }
        }],
        type: 'radio'
    }
];

export const updateSelected = (original, namespace, key, value, isSelected) => ({
    ...original,
    [namespace]: {
        ...original?.[namespace],
        [key]: {
            ...original?.[namespace]?.[key],
            isSelected,
            value
        }
    }
});

export const storeFilter = (tags, token) => {
    deleteLocalStorageItems(Object.keys(localStorage).filter(key => key.startsWith(GLOBAL_FILTER_KEY)));
    localStorage.setItem(
        `${GLOBAL_FILTER_KEY}/${token}`,
        JSON.stringify(Object.entries(tags).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: {
                ...Object.entries(value || {})
                .reduce((
                    currValue,
                    // eslint-disable-next-line no-unused-vars
                    [itemKey, { item, value: tagValue, group: { items, ...group } = {}, ...rest }]
                ) => ({
                    ...currValue,
                    [itemKey]: { ...rest, item: { tagValue: item?.tagValue || tagValue }, group }
                }), {})
            }
        }), {}))
    );
};
