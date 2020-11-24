import { deleteLocalStorageItems } from '../../utils';
import { decodeToken } from '../../jwt/jwt';
import omit from 'lodash/omit';
import flatMap from 'lodash/flatMap';
import memoize from 'lodash/memoize';
import { SID_KEY } from '../../redux/globalFilterReducers';

export const GLOBAL_FILTER_KEY = 'chrome:global-filter';
export const INVENTORY_API_BASE = '/api/inventory/v1';
export const workloads = [
  {
    name: 'Workloads',
    noFilter: true,
    tags: [
      {
        tag: { key: 'All workloads' },
      },
      {
        tag: { key: 'SAP' },
      },
    ],
    type: 'radio',
  },
];

export const selectWorkloads = () => ({
  [workloads?.[0]?.tags?.[0]?.tag?.key || 'All workloads']: {
    group: omit(workloads[0], 'tags'),
    isSelected: true,
    item: {},
  },
});

export const updateSelected = (original, namespace, key, value, isSelected, extra) => ({
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

export const createTagsFilter = (tags = []) =>
  tags.reduce((acc, curr) => {
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

export const storeFilter = (tags, token) => {
  deleteLocalStorageItems(Object.keys(localStorage).filter((key) => key.startsWith(GLOBAL_FILTER_KEY)));
  const searchParams = new URLSearchParams();
  const [, SIDs, mappedTags] = flatTags(tags, false, true);
  if (tags?.Workloads) {
    const currWorkloads = Object.entries(tags?.Workloads || {})?.find(([, { isSelected }]) => isSelected)?.[0];
    if (currWorkloads) {
      searchParams.append('workloads', currWorkloads);
    }
  }
  searchParams.append('SIDs', SIDs);
  searchParams.append('tags', mappedTags);

  location.hash = searchParams.toString();

  localStorage.setItem(
    `${GLOBAL_FILTER_KEY}/${token}`,
    JSON.stringify(
      Object.entries(tags).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            ...Object.entries(value || {}).reduce(
              (
                currValue,
                // eslint-disable-next-line no-unused-vars
                [itemKey, { item, value: tagValue, group: { items, ...group } = {}, ...rest }]
              ) => ({
                ...currValue,
                [itemKey]: {
                  ...rest,
                  item: { tagValue: item?.tagValue || tagValue, tagKey: item?.tagKey || itemKey },
                  group,
                },
              }),
              {}
            ),
          },
        }),
        {}
      )
    )
  );
};

export const generateFilter = async () => {
  const searchParams = new URLSearchParams(location.hash?.substring(1));
  const currToken = decodeToken(await insights.chrome.auth.getToken())?.session_state;
  let data;
  try {
    data = JSON.parse(localStorage.getItem(`${GLOBAL_FILTER_KEY}/${currToken}`) || '{}');
  } catch (e) {
    data = {};
  }

  let { Workloads, [SID_KEY]: SIDs, ...tags } = data;

  if (searchParams.get('workloads')) {
    const { tag } = workloads[0].tags.find(({ tag: { key } }) => key === searchParams.get('workloads')) || {};
    Workloads = tag?.key
      ? {
          [tag?.key]: {
            group: omit(workloads[0], 'tags'),
            isSelected: true,
            item: {},
          },
        }
      : data.Workloads;
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

  return [
    {
      Workloads,
      ...(SIDs && { [SID_KEY]: SIDs }),
      ...tags,
    },
    currToken,
  ];
};

export const flatTags = memoize(
  (filter, encode = false, format = false) => {
    const { Workloads, [SID_KEY]: SID, ...tags } = filter;
    const mappedTags = flatMap(Object.entries({ ...tags, ...(!format && { Workloads }) } || {}), ([namespace, item]) =>
      Object.entries(item || {})
        .filter(([, { isSelected }]) => isSelected)
        .map(
          ([tagKey, { item, value: tagValue }]) =>
            `${namespace ? `${encode ? encodeURIComponent(namespace) : namespace}/` : ''}${
              encode ? encodeURIComponent(item?.tagKey || tagKey) : item?.tagKey || tagKey
            }${item?.tagValue || tagValue ? `=${encode ? encodeURIComponent(item?.tagValue || tagValue) : item?.tagValue || tagValue}` : ''}`
        )
    );
    return format
      ? [
          Workloads,
          Object.entries(SID || {})
            .filter(([, { isSelected }]) => isSelected)
            .reduce((acc, [key]) => [...acc, key], []),
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
