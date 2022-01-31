import { conditionalFilterType } from '@redhat-cloud-services/frontend-components/ConditionalFilter';

export const tagsFilters = [
  {
    type: conditionalFilterType.text,
    label: 'Name',
    filterString: (value) => `name ~ ${value}`,
  },
  {
    type: conditionalFilterType.text,
    label: 'Value',
    filterString: (value) => `name ~ ${value}`,
  },
  {
    type: conditionalFilterType.checkbox,
    label: 'Tag source',
    items: [
      { label: 'Example Source', value: 'es' },
      { label: 'Example Source 1', value: 'es1' },
    ],
    filterString: (value) => `name ~ ${value}`,
  },
];

export const sidFilters = [
  {
    type: conditionalFilterType.text,
    label: 'Value',
  },
];
