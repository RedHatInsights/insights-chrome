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

const buildFilter = (workloads?: { [key: string]: Workload }, SID?: string[]) => {
  console.log('buildFilter: workloads:', workloads, 'SID:', SID);
  const result = {
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
  };
  console.log('buildFilter: result:', result);
  const generatedQuery = generateFilter(result);
  console.log('buildFilter: generated query:', generatedQuery);
  return result;
};

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
    // Update pagination state
    page: pagination?.page || 1,
    perPage: pagination?.perPage || 10,
    // Transform API results into the required GlobalFilterTag[] structure for TagsModal
    items: [
      {
        id: 'tags-group',
        name: 'Tags',
        tags: ((response as any).data?.results || (response as any).results || [])
          .filter((result: any) => result?.tag?.key && typeof result.tag.key === 'string' && result.tag.key.trim() !== '')
          .map((result: any) => {
            const namespace = result.tag.namespace || '';
            const key = result.tag.key || '';
            const value = result.tag.value || '';
            return {
              tag: {
                id: `${namespace}/${key}=${value}`,
                key: key,
                value: value,
                namespace: namespace,
                // Add group property for namespace headers
                group: { value: namespace, label: namespace, type: 'checkbox' },
              },
              count: result.count || 0,
            };
          })
          .filter((item: any) => item.tag.key && item.tag.id), // Additional safety check
      },
    ],
    // @ts-ignore
    count: (response as any).data?.count || (response as any).count,
    // @ts-ignore
    total: (response as any).data?.total || (response as any).total,
  }));
}

export async function getAllSIDs({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  console.log('getAllSIDs: activeTags input:', activeTags);
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
  console.log('getAllSIDs: flatTags output - workloads:', workloads, 'SID:', SID, 'selectedTags:', selectedTags);

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

  console.log('getAllSIDs: API response:', response);
  console.log('getAllSIDs: API response data:', (response as any).data || response);
  console.log('getAllSIDs: API response results:', (response as any).data?.results || (response as any).results || []);
  console.log('getAllSIDs: API response total/count:', {
    total: (response as any).data?.total || (response as any).total,
    count: (response as any).data?.count || (response as any).count,
  });

  // @ts-ignore
  chromeStore.set(sidsAtom, (prev) => ({
    ...prev,
    isLoaded: true,
    // Update pagination state
    page: pagination?.page || 1,
    perPage: pagination?.perPage || 10,
    // Transform API results into the required SID[] structure for TagsModal
    items: [
      {
        id: 'sids-group',
        name: 'SAP IDs (SID)',
        tags: ((response as any).data?.results || (response as any).results || [])
          .filter((item: any) => item?.value && typeof item.value === 'string' && item.value.trim() !== '')
          .map((item: any) => {
            const sidValue = item.value || '';
            return {
              tag: {
                id: sidValue,
                key: sidValue,
                value: '', // Empty value to avoid key=value format
                namespace: '',
              },
              count: item.count || 1,
            };
          })
          .filter((item: any) => item.tag.key && item.tag.id), // Additional safety check
      },
    ],
    // @ts-ignore
    count: (response as any).data?.count || (response as any).count,
    // @ts-ignore
    total: (response as any).data?.total || (response as any).total,
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
    { label: 'SAP', value: 'SAP', count: (SAP as any)?.data?.total || (SAP as any)?.total },
    // @ts-ignore
    { label: 'Ansible Automation Platform', value: 'AAP', count: AAP.total },
    // @ts-ignore
    { label: 'Microsoft SQL', value: 'MSSQL', count: MSSQL.total },
  ].filter(({ count }) => count > 0);

  chromeStore.set(workloadsAtom, (prev) => ({
    ...prev,
    isLoaded: true,
    // Transform the available workloads into the grouped structure for consistency
    items: [
      {
        id: 'workloads-group',
        name: 'Workloads',
        tags: availableWorkloads
          .filter((item) => item.value && item.label && typeof item.value === 'string' && typeof item.label === 'string')
          .map((item) => ({
            tag: {
              id: item.value,
              key: item.label,
              value: '', // Empty value to avoid key=value format
              namespace: '',
            },
            count: item.count,
          }))
          .filter((item: any) => item.tag.id), // Additional safety check
      },
    ],
    count: availableWorkloads.length,
    total: availableWorkloads.length,
  }));
}
