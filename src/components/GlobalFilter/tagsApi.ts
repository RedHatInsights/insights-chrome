/* eslint-disable @typescript-eslint/ban-ts-comment */
// FIXME: Figure out what are the issues with the JS client
/* eslint-disable camelcase */
import instance from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import { AAP_KEY, INVENTORY_API_BASE, MSSQL_KEY, flatTags } from './globalFilterApi';
import { HostsApi, SystemProfileApi, TagsApi } from '@redhat-cloud-services/host-inventory-client';
import { FlagTagsFilter } from '../../@types/types';
import { TagRegisteredWith, sidsAtom, tagsAtom, workloadsAtom } from '../../state/atoms/globalFilterAtom';
import chromeStore from '../../state/chromeStore';

export const tags = new TagsApi(undefined, INVENTORY_API_BASE, instance as any);
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

export async function getAllTags({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination?: TagPagination) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
  const response = await tags.apiTagGetTags(
    selectedTags,
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
    // @ts-ignore
    registeredWith ? registeredWith : undefined,
    undefined,
    { query: generateFilter(buildFilter(workloads, SID)) }
  );

  // @ts-ignore
  chromeStore.set(tagsAtom, (prev) => ({
    ...prev,
    isLoaded: true,
    // @ts-ignore - Transform API results into the required TagGroup[] structure
    items: (response.results || []).filter(Boolean).map((result) => ({
      label: `${result.tag.key}=${result.tag.value ?? ''}`, // The display text
      count: result.count || 0, // The count for the item
      tag: {
        id: result.tag.key,
        key: result.tag.key,
        label: result.tag.value ?? result.tag.key, // Display label
        value: result.tag.key,
      },
    })),
    // @ts-ignore
    count: response.count,
    // @ts-ignore
    total: response.total,
  }));
}

export async function getAllSIDs({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

  const response = await sap.apiSystemProfileGetSapSids(
    search,
    selectedTags,
    (pagination && pagination.perPage) || 10,
    (pagination && pagination.page) || 1,
    undefined,
    // @ts-ignore
    registeredWith ? registeredWith : undefined,
    undefined,
    {
      query: generateFilter(buildFilter(workloads, SID)),
    }
  );

  // @ts-ignore
  chromeStore.set(sidsAtom, (prev) => ({
    ...prev,
    isLoaded: true,
    // @ts-ignore
    items: (response.results || []).filter(Boolean).map((item) => {
      const sidValue = item.value;
      return {
        count: item.count || 1,
        tag: {
          id: sidValue,
          key: sidValue,
          label: sidValue,
        },
      };
    }),
    // @ts-ignore
    count: response.count,
    // @ts-ignore
    total: response.total,
  }));
}

export async function getAllWorkloads({ activeTags, registeredWith }: TagFilterOptions = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

  const [SAP, AAP, MSSQL] = await Promise.all([
    sap.apiSystemProfileGetSapSystem(
      selectedTags,
      1,
      1,
      undefined,
      // @ts-ignore
      registeredWith ? registeredWith : undefined,
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
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      selectedTags,
      // @ts-ignore
      registeredWith ? registeredWith : undefined,
      undefined,
      undefined,
      {
        query: generateFilter(buildFilter({ ...(workloads || {}), [AAP_KEY]: { isSelected: true } }, SID)),
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
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      selectedTags,
      // @ts-ignore
      registeredWith ? registeredWith : undefined,
      undefined,
      undefined,
      {
        query: generateFilter(buildFilter({ ...(workloads || {}), [MSSQL_KEY]: { isSelected: true } }, SID)),
      }
    ),
  ]);

  // Create a list of available workloads based on the API results.
  // @ts-ignore
  const availableWorkloads = [
    // @ts-ignore
    { label: 'SAP', value: 'SAP', count: SAP.total },
    // @ts-ignore
    { label: 'Ansible Automation Platform', value: 'AAP', count: AAP.total },
    // @ts-ignore
    { label: 'Microsoft SQL', value: 'MSSQL', count: MSSQL.total },
  ].filter(({ count }) => count > 0);

  chromeStore.set(workloadsAtom, (prev) => ({
    ...prev,
    isLoaded: true,
    // Transform the available workloads into the { count, tag } structure the UI expects.
    items: availableWorkloads.map((item) => ({
      count: item.count,
      tag: {
        id: item.value,
        key: item.label,
        label: item.label,
      },
    })),
    count: availableWorkloads.length,
    total: availableWorkloads.length,
  }));
}
