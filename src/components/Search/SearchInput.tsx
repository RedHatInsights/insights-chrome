import React, { useCallback, useRef, useState } from 'react';
import {
  Bullseye,
  Menu,
  MenuBreadcrumb,
  MenuContent,
  MenuItem,
  MenuList,
  SearchInput as PFSearchInput,
  Popper,
  SearchInputProps,
  Spinner,
} from '@patternfly/react-core';
import debounce from 'lodash/debounce';

import './SearchInput.scss';
import ChromeLink from '../ChromeLink';

const REPLACE_TAG = '@query';
/**
 * The ?q is the search term.
 * ------
 * The "~" after the search term enables fuzzy search (case sensitivity, similar results for typos).
 * For example "inventry" query yields results with Inventory string within it.
 * We can use distance ~(0-2) for example: "~2" to narrow restrict/expand the fuzzy search range
 *
 * Query parsin docs: https://solr.apache.org/guide/7_7/the-standard-query-parser.html#the-standard-query-parser
 */
const BASE_URL = `https://access.stage.redhat.com/hydra/rest/search/platform/console/?q=${REPLACE_TAG}~&fq=documentKind:ModuleDefinition&rows=10`;

export type SearchResultItem = {
  abstract?: string;
  allTitle: string;
  bundle: string[];
  bundile_title: string[];
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

const SearchInput = () => {
  const isEnabled = localStorage.getItem('chrome:experimental:search') === 'true';
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponseType>({
    docs: [],
    maxScore: 0,
    numFound: 0,
    start: 0,
  });

  const toggleRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMenuKeys = (event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }
    if (menuRef.current?.contains(event.target as Node) || toggleRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsOpen(!isOpen);
        toggleRef.current?.focus();
      }
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (isOpen && !menuRef.current?.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const onToggleKeyDown: SearchInputProps['onKeyDown'] = (ev) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (menuRef.current) {
        const firstElement = menuRef.current.querySelector('li > button:not(:disabled), li > a:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    if (!isOpen) {
      setIsOpen(!isOpen);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, menuRef]);

  if (!isEnabled) {
    return null;
  }

  const handleFetch = (value: string) => {
    return fetch(BASE_URL.replace(REPLACE_TAG, value))
      .then((r) => r.json())
      .then(({ response }: { response: SearchResponseType }) => {
        setSearchResults(response);
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  const debouncedFetch = useCallback(debounce(handleFetch, 500), []);

  const handleChange: SearchInputProps['onChange'] = (value) => {
    setSearchValue(value);
    setIsFetching(true);
    debouncedFetch(value);
  };

  const toggle = (
    <PFSearchInput
      ref={toggleRef}
      onKeyDown={onToggleKeyDown}
      placeholder="Search for services"
      value={searchValue}
      onChange={handleChange}
      className="chr-c-search__input"
    />
  );

  const menu = (
    <Menu ref={menuRef} onSelect={(_ev, itemId) => console.log('selected', itemId)}>
      <MenuContent>
        <MenuList>
          {isFetching ? (
            <Bullseye className="pf-u-p-md">
              <Spinner size="xl" />
            </Bullseye>
          ) : (
            <>
              {searchResults.docs.map(({ id, allTitle, abstract, relative_uri }) => (
                <MenuItem component={(props) => <ChromeLink {...props} href={relative_uri} />} description={abstract} key={id}>
                  {allTitle}
                </MenuItem>
              ))}
            </>
          )}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <div ref={containerRef} className="chr-c-search__input">
      <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen} />
    </div>
  );
};

export default SearchInput;
