import omit from 'lodash/omit';
import flatMap from 'lodash/flatMap';
import memoize from 'lodash/memoize';
import { AAP_KEY, MSSQL_KEY, SID_KEY } from '../../redux/globalFilterReducers';
import { getUrl } from '../../utils';

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

export const updateSelected = (
  original: { [key: string]: { [key: string]: Record<string, unknown> } },
  namespace: string,
  key: string,
  value: unknown,
  isSelected: boolean,
  extra: Record<string, unknown>
) => ({
  ...original,
  [namespace]: {
    ...original?.[namespace],
    [key]: {
      ...original?.[namespace]?.[key],
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

type Tag = {
  isSelected?: boolean;
  value: string;
  item?: {
    tagKey?: string;
    tagValue?: string;
  };
  group?: {
    items?: unknown;
  };
};

export type FlagTagsFilter = {
  [key: string]: {
    [key: string]: Tag;
  };
};

export const flatTags = memoize(
  (filter: FlagTagsFilter = {}, encode = false, format = false) => {
    const { Workloads, [SID_KEY]: SID, ...tags } = filter;
    const mappedTags = flatMap(Object.entries({ ...tags, ...(!format && { Workloads }) } || {}), ([namespace, item]) =>
      Object.entries(item || {})
        .filter(([, { isSelected }]) => isSelected)
        .map(([tagKey, { item, value: tagValue }]) => {
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
          Object.entries(SID || {})
            .filter(([, { isSelected }]) => isSelected)
            .reduce<any>((acc, [key]) => [...acc, key], []),
          mappedTags,
        ]
      : mappedTags;
  },
  (filter = {}, encode, format) =>
    `${Object.entries(filter)
      .map(
        ([namespace, val]) =>
          `${namespace}.${Object.entries(val || {})
            .filter(([, { isSelected }]) => isSelected)
            .map(([key]) => key)
            .join('')}`
      )
      .join(',')}${encode ? '_encode' : ''}${format ? '_format' : ''}`
);
