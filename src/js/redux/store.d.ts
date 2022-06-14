export type ChromeState = {};

export type GlobalFilterWorkloads = {
  isLoaded: boolean;
  hasSap: number;
  hasAap: number;
  hasMssql: number;
};

export type GlobalFilterSIDs = {
  isLoaded: boolean;
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
};

export type GlobalFilterTag = {
  name: string;
  tags: unknown;
};

export type GlobalFilterTags = {
  isLoaded: boolean;
  items: GlobalFilterTag[];
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
};

export type GlobalFilterState = {
  tags: GlobalFilterTags;
  globalFilterRemoved?: boolean;
  workloads: GlobalFilterWorkloads;
  sid: GlobalFilterSIDs;
  selectedTags: unknown;
  globalFilterHidden: boolean;
  scope: unknown;
};
