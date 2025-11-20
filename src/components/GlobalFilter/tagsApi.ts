import { AAP_KEY, INVENTORY_API_BASE, MSSQL_KEY, flatTags } from './globalFilterApi';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { apiHostGetHostList, apiTagGetTags } from '@redhat-cloud-services/host-inventory-client';
import { FlagTagsFilter, GroupItem } from '../../@types/types';
import { TagRegisteredWith, tagsAtom, workloadsAtom } from '../../state/atoms/globalFilterAtom';
import chromeStore from '../../state/chromeStore';
import { SystemProfileNestedObjectValue } from '@redhat-cloud-services/host-inventory-client/types';
import axios from 'axios';

const axiosInstance = axios.create();
const tagsApi = APIFactory(
  INVENTORY_API_BASE,
  {
    apiTagGetTags,
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

const buildFilter = (workloads?: { [key: string]: Workload }) => {
  return {
    system_profile: {
      workloads: {
        ...(workloads?.['SAP']?.isSelected && {
          sap: {
            sap_system: true,
          },
        }),
        ...(workloads?.[AAP_KEY]?.isSelected && {
          ansible: {
            controller_version: 'not_nil',
          },
        }),
        ...(workloads?.[MSSQL_KEY]?.isSelected && {
          mssql: {
            version: 'not_nil',
          },
        }),
      },
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
  const [workloads, , selectedTags] = flatTags(activeTags, false, true);
  const response = await tagsApi
    .apiTagGetTags({
      tags: selectedTags,
      orderBy: 'tag',
      orderHow: 'ASC',
      perPage: pagination?.perPage || 10,
      page: pagination?.page || 1,
      search,
      registeredWith: registeredWith ? [registeredWith] : undefined,
      filter: generateFilter(buildFilter(workloads)),
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

export async function getAllWorkloads({ activeTags, registeredWith }: TagFilterOptions = {}) {
  const [workloads, , selectedTags] = flatTags(activeTags, false, true);

  const selectedWorkloads = Object.entries(workloads || {}).reduce<typeof workloads>((acc, [k, w]) => {
    if ((w as GroupItem)?.isSelected) {
      acc[k] = { isSelected: true };
    }
    return acc;
  }, {});

  const keys = ['SAP', AAP_KEY, MSSQL_KEY] as const;
  const labels: Record<(typeof keys)[number], string> = {
    SAP: 'SAP',
    [AAP_KEY]: 'Ansible Automation Platform',
    [MSSQL_KEY]: 'Microsoft SQL',
  };

  const totals = await Promise.all(
    keys.map((key) => {
      const filterObj = buildFilter({ [key]: { isSelected: true }, ...selectedWorkloads });
      const params = generateFilter(filterObj);
      return tagsApi
        .apiHostGetHostList({
          registeredWith: registeredWith ? [registeredWith] : undefined,
          tags: selectedTags?.length ? selectedTags : undefined,
          perPage: 1,
          page: 1,
          options: { params },
        })
        .then((res) => getTotalFromResponse(res.data));
    })
  );

  const availableWorkloads = keys.map((value, i) => ({
    label: labels[value],
    value,
    count: totals[i],
  }));

  chromeStore.set(workloadsAtom, (prev) => ({
    ...prev,
    isLoaded: true,
    items: [
      {
        id: 'workloads-group',
        name: 'Workloads',
        tags: availableWorkloads.map(({ label, value, count }) => ({
          tag: { id: value, key: label, value: '', namespace: '' },
          count,
        })),
      },
    ],
    count: availableWorkloads.length,
    total: availableWorkloads.length,
  }));
}
