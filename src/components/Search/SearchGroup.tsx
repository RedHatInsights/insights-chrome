import { MenuGroup, MenuItem } from '@patternfly/react-core/dist/dynamic/components/Menu';
import React from 'react';
import ChromeLink from '../ChromeLink';
import SearchDescription from './SearchDescription';
import SearchTitle from './SearchTitle';
import {
  AUTOSUGGEST_TERM_DELIMITER,
  HighlightingResponseType,
  SearchAutoSuggestionResultItem,
  SearchResultItem,
  SearchResultItemAggregate,
} from './SearchTypes';

const SearchGroup = ({ items, highlighting }: { items: SearchResultItemAggregate[]; highlighting: HighlightingResponseType }) => {
  return items.length > 0 ? (
    <MenuGroup>
      {items.map((item) => {
        if (item.term) {
          const { term, payload } = item as SearchAutoSuggestionResultItem;
          const [allTitle, bundle_title, abstract] = term.split(AUTOSUGGEST_TERM_DELIMITER);
          return (
            <MenuItem
              className="pf-v5-u-mb-xs"
              component={(props) => <ChromeLink {...props} href={payload} />}
              description={<SearchDescription description={abstract} />}
              key={crypto.randomUUID()}
            >
              <SearchTitle title={allTitle} bundleTitle={bundle_title?.[0]} />
            </MenuItem>
          );
        }
        const { id, allTitle, bundle_title, abstract, relative_uri } = item as SearchResultItem;
        return (
          <MenuItem
            className="pf-v5-u-mb-xs"
            component={(props) => <ChromeLink {...props} href={relative_uri} />}
            description={<SearchDescription highlight={highlighting[id]?.abstract} description={abstract} />}
            key={id}
          >
            <SearchTitle title={allTitle} bundleTitle={bundle_title?.[0]} />
          </MenuItem>
        );
      })}
    </MenuGroup>
  ) : null;
};

export default SearchGroup;
