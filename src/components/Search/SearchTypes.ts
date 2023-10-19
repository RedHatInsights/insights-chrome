import { EitherNotBoth } from '@openshift/dynamic-plugin-sdk';

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

export type SearchAutoSuggestionResultItem = {
  term: string;
  weight: string;
  payload: string;
};

export type SearchResultItemAggregate = EitherNotBoth<SearchResultItem, SearchAutoSuggestionResultItem>;

export type SearchResponseType = {
  docs: SearchResultItem[];
  start: number;
  numFound: number;
  maxScore: number;
};

export type SearchAutoSuggestionResponseType = {
  suggest: {
    default: {
      [recordId: string]: {
        numFound: number;
        suggestions: SearchAutoSuggestionResultItem[];
      };
    };
  };
};

export type SearchResponseAggregate = SearchResponseType & SearchAutoSuggestionResponseType;

export type SearchHighlight = { allTitle?: string[]; abstract?: string[]; bundle_title?: string[]; bundle?: string[] };

export type HighlightingResponseType = {
  [recordId: string]: SearchHighlight;
};

export const AUTOSUGGEST_HIGHLIGHT_TAG = '<b>';

export const AUTOSUGGEST_TERM_DELIMITER = '|';
