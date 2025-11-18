import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { activeModuleAtom } from './activeModuleAtom';
import { FlagTagsFilter } from '../../@types/types';

// Create a safe sessionStorage wrapper with error handling
const createSafeStorage = <T>() => ({
  getItem: (key: string, initialValue: T): T => {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      const parsed = JSON.parse(item);
      return parsed as T;
    } catch (error) {
      console.warn(`[globalFilterAtom] Failed to parse sessionStorage item "${key}":`, error);
      console.warn(`[globalFilterAtom] Returning initial value instead`);
      // Clear the corrupted item
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`[globalFilterAtom] Failed to remove corrupted item:`, e);
      }
      return initialValue;
    }
  },
  setItem: (key: string, value: T): void => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && ('name' in error || 'code' in error)) {
        const err = error as { name?: string; code?: number };
        if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
          // Quota exceeded: notify user
          console.error(`[globalFilterAtom] Quota exceeded when setting sessionStorage for key "${key}".`, error);
          // User can continue without persistence
        } else {
          console.error(`[globalFilterAtom] Failed to set sessionStorage for key "${key}":`, error);
        }
      } else {
        console.error(`[globalFilterAtom] Failed to set sessionStorage for key "${key}":`, error);
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`[globalFilterAtom] Failed to remove from sessionStorage for key "${key}":`, error);
    }
  },
});

export const selectedTagsAtom = atomWithStorage<FlagTagsFilter>('insights-filter-selected', {}, createSafeStorage<FlagTagsFilter>());
export const isLoadedAtom = atom<boolean>((get) => {
  const tags = get(tagsAtom);
  const sid = get(sidsAtom);
  const workloads = get(workloadsAtom);

  return tags.isLoaded && sid.isLoaded && workloads.isLoaded;
});
export const globalFilterHiddenAtom = atom<boolean>(false);
export const globalFilterScopeAtom = atom<TagRegisteredWith[number] | undefined>(undefined);
export const isGlobalFilterDisabledAtom = atom<boolean>((get) => get(globalFilterHiddenAtom) || !get(activeModuleAtom));
export const tagsAtom = atom<GlobalFilterTags>({
  isLoaded: false,
  items: [],
  total: 0,
  count: 0,
  page: 1,
  perPage: 10,
});

export const sidsAtom = atom<GlobalFilterSIDs>({
  isLoaded: false,
  items: [],
  total: 0,
  count: 0,
  page: 1,
  perPage: 10,
});

export const workloadsAtom = atom<GlobalFilterWorkloads>({
  isLoaded: false,
  name: 'Workloads',
  items: [],
  total: 0,
  count: 0,
  page: 1,
  perPage: 10,
});

// Write atom to set loading state for all global filter atoms at once
export const setAllLoadingAtom = atom(null, (get, set, isLoaded: boolean) => {
  set(tagsAtom, (prev) => ({ ...prev, isLoaded }));
  set(sidsAtom, (prev) => ({ ...prev, isLoaded }));
  set(workloadsAtom, (prev) => ({ ...prev, isLoaded }));
});

// Read atom that combines all global filter data into a single object
export const globalFilterDataAtom = atom((get) => {
  const tags = get(tagsAtom);
  const sids = get(sidsAtom);
  const workloads = get(workloadsAtom);
  const isLoaded = tags.isLoaded && sids.isLoaded && workloads.isLoaded;

  return {
    isLoaded,
    tags,
    sids,
    workloads,
    count: (tags.count || 0) + (sids.count || 0) + (workloads.count || 0),
    total: (tags.total || 0) + (sids.total || 0) + (workloads.total || 0),
  };
});

export type TagRegisteredWith = Array<
  'insights' | 'yupana' | 'puptoo' | 'rhsm-conduit' | 'cloud-connector' | '!yupana' | '!puptoo' | '!rhsm-conduit' | '!cloud-connector'
>;

export type CommonTag = {
  key?: string;
  namespace?: string;
  value?: string | number | boolean;
};

// Generic base type for all global filter data structures
export type GlobalFilterBase<T = unknown> = {
  isLoaded: boolean;
  items: T[];
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
};

export type GlobalFilterTag = {
  id?: string;
  name?: string;
  tags?: {
    tag: CommonTag;
  }[];
};

export type SID = {
  id?: string;
  name?: string;
  tags?: {
    tag: CommonTag;
  }[];
};

// Specific type aliases using the generic base
export type GlobalFilterTags = GlobalFilterBase<GlobalFilterTag>;
export type GlobalFilterSIDs = GlobalFilterBase<SID>;

// Workloads extends the base type with additional properties
export type GlobalFilterWorkloads = GlobalFilterBase & {
  name: 'Workloads';
  selected?: boolean;
  noFilter?: true;
  tags?: { tag?: CommonTag; count: number }[];
};

export type CommonSelectedTag = CommonTag & {
  id: string;
  cells: [string, string, string];
  selected?: boolean;
};
