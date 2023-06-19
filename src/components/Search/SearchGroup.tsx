import { MenuGroup, MenuItem } from '@patternfly/react-core/dist/dynamic/components/Menu';
import React from 'react';
import ChromeLink from '../ChromeLink';
import SearchDescription from './SearchDescription';
import SearchTitle from './SearchTitle';
import { HighlightingResponseType, SearchResultItem } from './SearchTypes';

const SearchGroup = ({ items, highlighting }: { items: SearchResultItem[]; highlighting: HighlightingResponseType }) => {
  return items.length > 0 ? (
    <MenuGroup>
      {items.map(({ id, allTitle, bundle_title, abstract, relative_uri }) => (
        <MenuItem
          className="pf-v5-u-mb-xs"
          component={(props) => <ChromeLink {...props} href={relative_uri} />}
          description={<SearchDescription highlight={highlighting[id]?.abstract} description={abstract} />}
          key={id}
        >
          <SearchTitle title={allTitle} bundleTitle={bundle_title?.[0]} />
        </MenuItem>
      ))}
    </MenuGroup>
  ) : null;
};

export default SearchGroup;
