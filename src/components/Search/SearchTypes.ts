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

export type SearchResponseType = {
  docs: SearchResultItem[];
  start: number;
  numFound: number;
  maxScore: number;
};

export type SearchAutoSuggestionResponseType = {
  suggest: {
    improvedInfixSuggester: {
      [recordId: string]: {
        numFound: number;
        suggestions: SearchAutoSuggestionResultItem[];
      };
    };
    default: {
      [recordId: string]: {
        numFound: number;
        suggestions: SearchAutoSuggestionResultItem[];
      };
    };
  };
};

export const AUTOSUGGEST_TERM_DELIMITER = '|';
