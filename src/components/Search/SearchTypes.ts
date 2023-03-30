export type SearchResultItem = {
  abstract: string;
  allTitle: string;
  bundle: string[];
  bundle_title: string[];
  documentKind: string;
  id: string;
  relative_uri: string;
  view_uri: string;
};

export type SearchResponseType = {
  docs: SearchResultItem[];
  start: number;
  numFound: number;
  maxScore: number;
};

export type SearchHighlight = { allTitle?: string[]; abstract?: string[]; bundle_title?: string[]; bundle?: string[] };

export type HighlightingResponseType = {
  [recordId: string]: SearchHighlight;
};
