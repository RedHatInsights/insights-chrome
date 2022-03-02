/* eslint-disable camelcase */
import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import { flatTags, INVENTORY_API_BASE } from './constants';
import { TagsApi, SapSystemApi, HostsApi } from '@redhat-cloud-services/host-inventory-client';
import { AAP_KEY, MSSQL_KEY } from '../../redux/globalFilterReducers';
export const tags = new TagsApi(undefined, INVENTORY_API_BASE, instance);
export const sap = new SapSystemApi(undefined, INVENTORY_API_BASE, instance);
export const system = new HostsApi(undefined, INVENTORY_API_BASE, instance);

/**
 * This has to be pulled out of FEC for a while until we split react and non react helper functions
 */
export const generateFilter = (data, path = 'filter', options) =>
  Object.entries(data || {}).reduce((acc, [key, value]) => {
    const newPath = `${path || ''}[${key}]${Array.isArray(value) ? `${options?.arrayEnhancer ? `[${options.arrayEnhancer}]` : ''}[]` : ''}`;
    if (value instanceof Function || value instanceof Date) {
      return acc;
    }

    return {
      ...acc,
      ...(Array.isArray(value) || typeof value !== 'object' ? { [newPath]: value } : generateFilter(value, newPath, options)),
    };
  }, {});

const buildFilter = (workloads, SID) => ({
  system_profile: {
    ...(workloads?.SAP?.isSelected && { sap_system: true }),
    // enable once AAP filter is enabled
    ...(workloads?.[AAP_KEY]?.isSelected && {
      ansible: 'not_nil',
    }),
    ...(workloads?.[MSSQL_KEY]?.isSelected && {
      mssql: { version: 'not_nil' },
    }),
    sap_sids: SID,
  },
});

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
    {
      query: generateFilter(buildFilter(workloads, SID)),
    }
  );
}

export function getAllSIDs({ search, activeTags, registeredWith } = {}, pagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

  return sap.apiSystemProfileGetSapSids(
    search,
    selectedTags, // tags
    (pagination && pagination.perPage) || 10,
    (pagination && pagination.page) || 1,
    undefined, // staleness,
    registeredWith,
    undefined,
    {
      query: generateFilter(buildFilter(workloads, SID)),
    }
  );
}

export async function getAllWorkloads({ activeTags, registeredWith } = {}, pagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

  const [SAP, AAP, MSSQL] = await Promise.all([
    sap.apiSystemProfileGetSapSystem(
      selectedTags, // tags
      (pagination && pagination.perPage) || 10,
      (pagination && pagination.page) || 1,
      undefined, // staleness,
      registeredWith,
      undefined,
      {
        query: generateFilter(buildFilter(workloads, SID)),
      }
    ),
    system.apiHostGetHostList(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['fresh', 'stale_warning'],
      selectedTags,
      registeredWith,
      undefined,
      undefined,
      {
        query: generateFilter(
          buildFilter(
            {
              ...(workloads || {}),
              [AAP_KEY]: { isSelected: true },
            },
            SID
          )
        ),
      }
    ),
    system.apiHostGetHostList(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['fresh', 'stale_warning'],
      selectedTags,
      registeredWith,
      undefined,
      undefined,
      {
        query: generateFilter(
          buildFilter(
            {
              ...(workloads || {}),
              [MSSQL_KEY]: { isSelected: true },
            },
            SID
          )
        ),
      }
    ),
  ]);
  return { SAP, AAP, MSSQL };
}
