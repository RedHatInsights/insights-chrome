import { FlagTagsFilter } from '../@types/types';

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

export type CommonTag = {
  key?: string;
  namespace?: string;
  value?: string | number | boolean;
};

export type CommonSelectedTag = CommonTag & {
  id: string;
  cells: [string, string, string];
  selected?: boolean;
};

export type SID = {
  id?: string;
  name?: string;
  tags?: {
    tag: CommonTag;
  }[];
};

export type GlobalFilterSIDs = {
  isLoaded: boolean;
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
  items?: SID[];
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

export type TagRegisteredWith = Array<
  'insights' | 'yupana' | 'puptoo' | 'rhsm-conduit' | 'cloud-connector' | '!yupana' | '!puptoo' | '!rhsm-conduit' | '!cloud-connector'
>;

export type GlobalFilterState = {
  tags: GlobalFilterTags;
  globalFilterRemoved?: boolean;
  workloads: GlobalFilterWorkloads;
  sid: GlobalFilterSIDs;
  selectedTags?: FlagTagsFilter;
  globalFilterHidden: boolean;
  scope?: TagRegisteredWith[number];
};

export type ReduxState = {
  globalFilter: GlobalFilterState;
};
