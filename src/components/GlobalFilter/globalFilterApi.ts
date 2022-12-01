import omit from 'lodash/omit';
import flatMap from 'lodash/flatMap';
import memoize from 'lodash/memoize';

import { getUrl } from '../../utils/common';
import { FlagTagsFilter, GroupItem } from '../../@types/types';

export const SID_KEY = 'SAP ID (SID)';
export const AAP_KEY = 'Ansible Automation Platform';
export const MSSQL_KEY = 'Microsoft SQL';

export const INVENTORY_API_BASE = '/api/inventory/v1';
export const workloads = [
  {
    name: 'Workloads',
    noFilter: true,
    tags: [
      {
        tag: { key: 'SAP' },
      },
      {
        tag: { key: AAP_KEY },
      },
      {
        tag: { key: MSSQL_KEY },
      },
    ],
  },
];

export type UpdateSelected = (
  original: FlagTagsFilter,
  namespace: string,
  key: string,
  value: string | undefined,
  isSelected: boolean,
  extra: Record<string, { tagKey?: string }>
) => FlagTagsFilter;

export const updateSelected: UpdateSelected = (original, namespace, key, value, isSelected, extra) => ({
  ...original,
  [namespace]: {
    ...original?.[namespace],
    [key]: {
      ...(original?.[namespace]?.[key] as GroupItem),
      isSelected,
      value,
      ...extra,
    },
  },
});

export const createTagsFilter = (tags: string[] = []) =>
  tags.reduce<
    Record<
      string,
      Record<string, { isSelected?: boolean; item: { tagValue: string; tagKey: string; group?: { value: string; label: string; type: string } } }>
    >
  >((acc, curr) => {
    const [namespace, tag] = curr.split('/');
    const [tagKey, tagValue] = tag?.split('=') || [];
    return {
      ...acc,
      [namespace]: {
        ...(acc[namespace] || {}),
        ...(tagKey?.length > 0 && {
          [`${tagKey}${tagValue ? `=${tagValue}` : ''}`]: {
            isSelected: true,
            group: { value: namespace, label: namespace, type: 'checkbox' },
            item: { tagValue, tagKey },
          },
        }),
      },
    };
  }, {});

export const generateFilter = () => {
  const searchParams = new URLSearchParams(location.hash?.substring(1));

  // Ansible bundle requires AAP to be active at all times
  if (getUrl('bundle') === 'ansible') {
    searchParams.set('workloads', AAP_KEY);
  }

  let Workloads = {};
  let tags = {};
  let SIDs = {};

  if (searchParams.get('workloads')) {
    const { tag } = workloads[0].tags.find(({ tag: { key } }) => key === searchParams.get('workloads')) || {};
    Workloads = tag?.key
      ? {
          [tag?.key]: {
            group: omit(workloads[0], 'tags'),
            isSelected: true,
            item: { tagKey: tag?.key },
          },
        }
      : {};
  }

  if (typeof searchParams.get('tags') === 'string') {
    tags = createTagsFilter(searchParams.get('tags')?.split(','));
  }

  if (typeof searchParams.get('SIDs') === 'string') {
    SIDs = createTagsFilter(
      searchParams
        .get('SIDs')
        ?.split(',')
        .map((sid) => `${SID_KEY}/${sid}`)
    )?.[SID_KEY];
  }

  return {
    Workloads,
    ...(SIDs && { [SID_KEY]: SIDs }),
    ...tags,
  };
};

export const escaper = (value: string) => value.replace(/\//gi, '%2F').replace(/=/gi, '%3D');

export const flatTags = memoize(
  (filter: FlagTagsFilter = {}, encode = false, format = false) => {
    const { Workloads, [SID_KEY]: SID, ...tags } = filter;
    const mappedTags = flatMap(Object.entries({ ...tags, ...(!format && { Workloads }) } || {}), ([namespace, item]) =>
      Object.entries<any>(item || {})
        .filter(([, { isSelected }]: [unknown, GroupItem]) => isSelected)
        .map(([tagKey, { item, value: tagValue }]: [any, GroupItem & { value: string }]) => {
          return `${namespace ? `${encode ? encodeURIComponent(escaper(namespace)) : escaper(namespace)}/` : ''}${
            encode ? encodeURIComponent(escaper(item?.tagKey || tagKey)) : escaper(item?.tagKey || tagKey)
          }${
            item?.tagValue || tagValue
              ? `=${encode ? encodeURIComponent(escaper(item?.tagValue || tagValue)) : escaper(item?.tagValue || tagValue)}`
              : ''
          }`;
        })
    );
    return format
      ? [
          Workloads,
          Object.entries<any>(SID || {})
            .filter(([, { isSelected }]: [unknown, GroupItem]) => isSelected)
            .reduce<any>((acc, [key]) => [...acc, key], []),
          mappedTags,
        ]
      : mappedTags;
  },
  (filter = {}, encode, format) =>
    `${Object.entries(filter)
      .map(
        ([namespace, val]) =>
          `${namespace}.${Object.entries<any>(val || {})
            .filter(([, { isSelected }]) => isSelected)
            .map(([key]) => key)
            .join('')}`
      )
      .join(',')}${encode ? '_encode' : ''}${format ? '_format' : ''}`
);
