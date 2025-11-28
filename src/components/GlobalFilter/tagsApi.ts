import { AAP_KEY, INVENTORY_API_BASE, MSSQL_KEY, SID_KEY, flatTags } from './globalFilterApi';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { apiHostGetHostList, apiSystemProfileGetSapSids, apiSystemProfileGetSapSystem, apiTagGetTags } from '@redhat-cloud-services/host-inventory-client';
import { FlagTagsFilter } from '../../@types/types';
import { TagRegisteredWith, sidsAtom, tagsAtom, workloadsAtom } from '../../state/atoms/globalFilterAtom';
import chromeStore from '../../state/chromeStore';
import { SystemProfileNestedObjectValue } from '@redhat-cloud-services/host-inventory-client/types';
import axios from 'axios';

const axiosInstance = axios.create();
const tagsApi = APIFactory(
  INVENTORY_API_BASE,
  {
    apiTagGetTags,
    apiSystemProfileGetSapSids,
    apiSystemProfileGetSapSystem,
    apiHostGetHostList,
  },
  {
    axios: axiosInstance,
  }
);

export type Workload = { isSelected?: boolean };
export type TagPagination = { perPage?: number; page?: number };
export type TagFilterOptions = { search?: string; registeredWith?: TagRegisteredWith[number]; activeTags?: FlagTagsFilter };

// Types for API responses
type ApiResponse<T> = {
  data?: {
    results?: T[];
    count?: number;
    total?: number;
  };
  results?: T[];
  count?: number;
  total?: number;
};

type TagResult = {
  tag?: {
    key?: string;
    value?: string;
    namespace?: string;
  };
  count?: number;
};

type SidResult = {
  value?: string;
  count?: number;
};

type WorkloadResult = {
  count?: number;
};

// Type guards for API responses
function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const obj = response as Record<string, unknown>;

  return (
    ('data' in obj && typeof obj.data === 'object') ||
    ('results' in obj && Array.isArray(obj.results)) ||
    ('count' in obj && typeof obj.count === 'number') ||
    ('total' in obj && typeof obj.total === 'number')
  );
}

function isTagResult(item: unknown): item is TagResult {
  return typeof item === 'object' && item !== null && ('tag' in item || 'count' in item);
}

function isSidResult(item: unknown): item is SidResult {
  return typeof item === 'object' && item !== null && ('value' in item || 'count' in item);
}

// Helper functions to safely extract data from API responses
function getResultsFromResponse<T>(response: unknown): T[] {
  if (!isApiResponse<T>(response)) return [];
  return response.data?.results || response.results || [];
}

function getCountFromResponse(response: unknown): number {
  if (!isApiResponse(response)) return 0;
  return response.data?.count || response.count || 0;
}

function getTotalFromResponse(response: unknown): number {
  if (!isApiResponse(response)) return 0;
  return response.data?.total || response.total || 0;
}

const buildFilter = (workloads?: { [key: string]: Workload }, SID?: string[]) => {
  return {
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
};

type GenerateFilterData = ReturnType<typeof buildFilter> | string | boolean | string[] | undefined;

/**
 * This has to be pulled out of FEC for a while until we split react and non react helper functions
 */
const generateFilter = (data: GenerateFilterData, path = 'filter', options?: { arrayEnhancer?: string }): { [key: string]: SystemProfileNestedObjectValue } =>
  Object.entries(data || {}).reduce<{ [key: string]: SystemProfileNestedObjectValue }>((acc, [key, value]) => {
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
  const response = await tagsApi
    .apiTagGetTags({
      tags: selectedTags,
      orderBy: 'tag',
      orderHow: 'ASC',
      perPage: pagination?.perPage || 10,
      page: pagination?.page || 1,
      search,
      registeredWith: registeredWith ? [registeredWith] : undefined,
      filter: generateFilter(buildFilter(workloads, SID)),
    })
    .then((res) => res.data);

  const results = getResultsFromResponse<TagResult>(response);
  const count = getCountFromResponse(response);
  const total = getTotalFromResponse(response);

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
        tags: results
          .filter(
            (result): result is TagResult => isTagResult(result) && !!result?.tag?.key && typeof result.tag.key === 'string' && result.tag.key.trim() !== ''
          )
          .map((result) => {
            const namespace = result.tag?.namespace || '';
            const key = result.tag?.key || '';
            const value = result.tag?.value || '';
            return {
              tag: {
                id: `${namespace}/${key}=${value}`,
                key: key,
                value: value,
                namespace: namespace,
              },
              count: result.count || 0,
            };
          })
          .filter((item) => item.tag.key && item.tag.id), // Additional safety check
      },
    ],
    count,
    total,
  }));
}

export async function getAllSIDs({ search, activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);
  const response = await tagsApi
    .apiSystemProfileGetSapSids({
      search,
      tags: selectedTags,
      perPage: pagination?.perPage || 10,
      page: pagination?.page || 1,
      registeredWith: registeredWith ? [registeredWith] : undefined,
      filter: generateFilter(buildFilter(workloads, SID)),
    })
    .then((res) => res.data);

  const results = getResultsFromResponse<SidResult>(response);
  const count = getCountFromResponse(response);
  const total = getTotalFromResponse(response);

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
        tags: results
          .filter((item): item is SidResult => isSidResult(item) && !!item?.value && typeof item.value === 'string' && item.value.trim() !== '')
          .map((item) => {
            const sidValue = item.value || '';
            return {
              tag: {
                id: `${SID_KEY}/${sidValue}`,
                key: sidValue,
                value: '', // Empty value to avoid key=value format
                namespace: SID_KEY,
              },
              count: item.count || 1,
            };
          })
          .filter((item) => item.tag.key && item.tag.id), // Additional safety check
      },
    ],
    count,
    total,
  }));
}

export async function getAllWorkloads({ activeTags, registeredWith }: TagFilterOptions = {}, pagination: TagPagination = {}) {
  const [workloads, SID, selectedTags] = flatTags(activeTags, false, true);

  const [SAP, AAP, MSSQL] = await Promise.all([
    tagsApi
      .apiSystemProfileGetSapSystem({
        filter: generateFilter(buildFilter(workloads, SID)),
        tags: selectedTags,
        registeredWith: registeredWith ? [registeredWith] : undefined,
        perPage: pagination.perPage || 1,
        page: pagination.page || 1,
      })
      .then((res) => res.data),
    tagsApi
      .apiHostGetHostList({
        filter: generateFilter(buildFilter({ ...(workloads || {}), [AAP_KEY]: { isSelected: true } }, SID)),
        registeredWith: registeredWith ? [registeredWith] : undefined,
        tags: selectedTags,
        perPage: 1,
        page: 1,
      })
      .then((res) => res.data),
    tagsApi
      .apiHostGetHostList({
        filter: generateFilter(buildFilter({ ...(workloads || {}), [MSSQL_KEY]: { isSelected: true } }, SID)),
        registeredWith: registeredWith ? [registeredWith] : undefined,
        tags: selectedTags,
        perPage: 1,
        page: 1,
      })
      .then((res) => res.data),
  ]);

  // Safely extract data from responses
  const sapResults = getResultsFromResponse<WorkloadResult>(SAP);
  const aapTotal = getTotalFromResponse(AAP);
  const mssqlTotal = getTotalFromResponse(MSSQL);

  // Create a list of available workloads based on the API results.
  const availableWorkloads = [
    { label: 'SAP', value: 'SAP', count: sapResults[0]?.count || 0 },
    { label: 'Ansible Automation Platform', value: 'AAP', count: aapTotal },
    { label: 'Microsoft SQL', value: 'MSSQL', count: mssqlTotal },
  ];

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
          .filter((item) => item.tag.id), // Additional safety check
      },
    ],
    count: availableWorkloads.length,
    total: availableWorkloads.length,
  }));
}
