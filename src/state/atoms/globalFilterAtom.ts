import { atom } from 'jotai';
import { activeModuleAtom } from './activeModuleAtom';
import { FlagTagsFilter } from '../../@types/types';

export const selectedTagsAtom = atom<FlagTagsFilter>({});
export const isLoadedAtom = atom<boolean>((get) => {
  const tags = get(tagsAtom);
  const sid = get(sidsAtom);
  const workloads = get(workloadsAtom);

  return tags.isLoaded && sid.isLoaded && workloads.isLoaded;
});
export const globalFilterHiddenAtom = atom<boolean>(false);
export const registeredWithAtom = atom<TagRegisteredWith[number] | undefined>(undefined);
export const isDisabledAtom = atom<boolean>((get) => get(globalFilterHiddenAtom) || !get(activeModuleAtom));
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

export type TagRegisteredWith = Array<
  'insights' | 'yupana' | 'puptoo' | 'rhsm-conduit' | 'cloud-connector' | '!yupana' | '!puptoo' | '!rhsm-conduit' | '!cloud-connector'
>;

export type CommonTag = {
  key?: string;
  namespace?: string;
  value?: string | number | boolean;
};

export type GlobalFilterTag = {
  id?: string;
  name?: string;
  tags?: {
    tag: CommonTag;
  }[];
};

export type GlobalFilterTags = {
  isLoaded: boolean;
  items: GlobalFilterTag[];
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
};

export type GlobalFilterSIDs = {
  isLoaded: boolean;
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
  items?: SID[];
};

export type SID = {
  id?: string;
  name?: string;
  tags?: {
    tag: CommonTag;
  }[];
};

export type GlobalFilterWorkloads = {
  selected?: boolean;
  page?: number;
  perPage?: number;
  isLoaded: boolean;
  name: 'Workloads';
  noFilter?: true;
  tags?: { tag?: CommonTag; count: number }[];
  items?: any[];
  count?: number;
  total?: number;
};

export type CommonSelectedTag = CommonTag & {
  id: string;
  cells: [string, string, string];
  selected?: boolean;
};
