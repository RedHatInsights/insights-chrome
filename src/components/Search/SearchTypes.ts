export type SearchResultItem = {
  term: string;
  weight: string;
  payload: string;
};

export type SearchResponseType = {
  suggest: {
    default: {
      [recordId: string]: {
        numFound: number;
        suggestions: SearchResultItem[];
      };
    };
  };
};

export const AUTOSUGGEST_HIGHLIGHT_TAG = '<b>';

export const AUTOSUGGEST_TERM_DELIMITER = '|';
