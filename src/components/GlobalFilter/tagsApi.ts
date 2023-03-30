/* eslint-disable camelcase */
import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import { AAP_KEY, INVENTORY_API_BASE, MSSQL_KEY, flatTags } from './globalFilterApi';
import { HostsApi, SystemProfileApi, TagsApi } from '@redhat-cloud-services/host-inventory-client';
import { FlagTagsFilter } from '../../@types/types';
import { TagRegisteredWith } from '../../redux/store';

export const tags = new TagsApi(undefined, INVENTORY_API_BASE, instance);
export const sap = new SystemProfileApi(undefined, INVENTORY_API_BASE, instance as any);
export const system = new HostsApi(undefined, INVENTORY_API_BASE, instance as any);

export type Workload = { isSelected?: boolean };
export type TagPagination = { perPage?: number; page?: number };
export type TagFilterOptions = { search?: string; registeredWith?: TagRegisteredWith[number]; activeTags?: FlagTagsFilter };

const buildFilter = (workloads?: { [key: string]: Workload }, SID?: string[]) => ({
  system_profile: {
    ...(workloads?.SAP?.isSelected && { sap_system: true }),
    // enable once AAP filter is enabled
    ...(workloads?.[AAP_KEY]?.isSelected && {
      ansible: 'not_nil',
    }),
    ...(workloads?.[MSSQL_KEY]?.isSelected && {
      mssql: 'not_nil',
    }),
    sap_sids: SID,
  },
});

type GenerateFilterData = ReturnType<typeof buildFilter> | string | boolean | string[] | undefined;

/**
 * This has to be pulled out of FEC for a while until we split react and non react helper functions
 */
const generateFilter = (
  data: GenerateFilterData,
  path = 'filter',
  options?: { arrayEnhancer?: string }
): { [key: string]: string | boolean | string[] } =>
  Object.entries(data || {}).reduce<{ [key: string]: boolean | string | string[] }>((acc, [key, value]) => {
    const newPath = `${path || ''}[${key}]${Array.isArray(value) ? `${options?.arrayEnhancer ? `[${options.arrayEnhancer}]` : ''}[]` : ''}`;
    if (value instanceof Function || value instanceof Date) {
      return acc;
    }

    return {
      ...acc,
      ...(Array.isArray(value) || typeof value !== 'object' ? { [newPath]: value } : generateFilter(value, newPath, options)),
    };
  }, {});

export function getAllTags({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination?: TagPagination) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
  return tags.apiTagGetTags(
    selectedTags, // tag filer
    'tag',
    'ASC',
    pagination?.perPage || 10,
    pagination?.page || 1,
    undefined,
    search,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    registeredWith ? [registeredWith] : undefined,
    undefined,
    {
      query: generateFilter(buildFilter(workloads, SID)),
    }
  );
}

export function getAllSIDs({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

  return sap.apiSystemProfileGetSapSids(
    search,
    selectedTags, // tags
    (pagination && pagination.perPage) || 10,
    (pagination && pagination.page) || 1,
    undefined, // staleness,
    registeredWith ? [registeredWith] : undefined,
    undefined,
    {
      query: generateFilter(buildFilter(workloads, SID)),
    }
  );
}

export async function getAllWorkloads({ activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
  const [SAP, AAP, MSSQL] = await Promise.all([
    sap.apiSystemProfileGetSapSystem(
      selectedTags, // tags
      (pagination && pagination.perPage) || 10,
      (pagination && pagination.page) || 1,
      undefined, // staleness,
      registeredWith ? [registeredWith] : undefined,
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
      1, // number of items per page
      undefined,
      undefined,
      undefined,
      undefined,
      selectedTags,
      registeredWith ? [registeredWith] : undefined,
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
      1, // number of items per page
      undefined,
      undefined,
      undefined,
      undefined,
      selectedTags,
      registeredWith ? [registeredWith] : undefined,
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
