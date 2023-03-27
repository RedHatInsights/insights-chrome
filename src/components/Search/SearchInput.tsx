import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bullseye,
  Menu,
  MenuContent,
  MenuGroup,
  MenuList,
  SearchInput as PFSearchInput,
  Popper,
  SearchInputProps,
  Spinner,
} from '@patternfly/react-core';
import debounce from 'lodash/debounce';

import './SearchInput.scss';
import SearchGroup from './SearchGroup';
import { HighlightingResponseType, SearchResponseType, SearchResultItem } from './SearchTypes';
import EmptySearchState from './EmptySearchState';

const REPLACE_TAG = 'REPLACE_TAG';
/**
 * The ?q is the search term.
 * ------
 * The "~" after the search term enables fuzzy search (case sensitivity, similar results for typos).
 * For example "inventry" query yields results with Inventory string within it.
 * We can use distance ~(0-2) for example: "~2" to narrow restrict/expand the fuzzy search range
 *
 * Query parsin docs: https://solr.apache.org/guide/7_7/the-standard-query-parser.html#the-standard-query-parser
 *
 * hl=true enables string "highlight"
 * hl.fl=field_name specifies field to be highlighted
 */

const BASE_SEARCH = new URLSearchParams();
BASE_SEARCH.append('q', `${REPLACE_TAG}~2`); // add query replacement tag and enable fuzzy search with ~1
BASE_SEARCH.append('fq', 'documentKind:ModuleDefinition'); // search for ModuleDefinition documents
BASE_SEARCH.append('fl', 'allTitle, bundle_title, bundle, abstract, href, relative_uri, id'); // list of valid rows
BASE_SEARCH.append('rows', '10'); // request 10 results
BASE_SEARCH.append('hl', 'true'); // enable highlight
BASE_SEARCH.append('hl.method', 'original'); // choose highlight method
BASE_SEARCH.append('hl.fl', 'abstract'); // highlight description
BASE_SEARCH.append('hl.fl', 'allTitle'); // highlight title
BASE_SEARCH.append('hl.fl', 'bundle_title'); // highlight bundle title
BASE_SEARCH.append('hl.fl', 'bundle'); // highlight bundle id
BASE_SEARCH.append('hl.snippets', '3'); // enable up to 3 highlights in a single string
BASE_SEARCH.append('hl.simple.pre', '<span class="hl">'); // specify HL opening/closing tags
BASE_SEARCH.append('hl.simple.post', '</span>');
BASE_SEARCH.append('hl.mergeContiguous', 'true'); // Use only one highlight atrribute to simply tag replacement.

const BASE_URL = new URL('https://access.stage.redhat.com/hydra/rest/search/platform/console/');
BASE_URL.search = BASE_SEARCH.toString();
const SEARCH_QUERY = BASE_URL.toString();

const getMaxMenuHeight = (menuElement?: HTMLDivElement | null) => {
  if (!menuElement) {
    return 0;
  }
  const { height: bodyHeight } = document.body.getBoundingClientRect();
  const { top: menuTopOffset } = menuElement.getBoundingClientRect();
  // do not allow the menu to overflow the screen
  // leave 4 px free on the bottom of the viewport
  return bodyHeight - menuTopOffset - 4;
};

type SearchCategories = {
  highLevel: SearchResultItem[];
  midLevel: SearchResultItem[];
  lowLevel: SearchResultItem[];
};

const initialSearchState: SearchResponseType = {
  docs: [],
  maxScore: 0,
  numFound: 0,
  start: 0,
};

const SearchInput = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponseType>(initialSearchState);
  const [highlighting, sethigHlighting] = useState<HighlightingResponseType>({});

  const isMounted = useRef(false);
  const toggleRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // sort result items based on matched field and its priority
  const resultCategories = useMemo(
    () =>
      searchResults.docs.reduce<SearchCategories>(
        (acc, curr) => {
          if (highlighting[curr.id]?.allTitle) {
            return {
              ...acc,
              highLevel: [...acc.highLevel, curr],
            };
          }

          if (highlighting[curr.id]?.abstract) {
            return {
              ...acc,
              midLevel: [...acc.midLevel, curr],
            };
          }

          return {
            ...acc,
            lowLevel: [...acc.lowLevel, curr],
          };
        },
        {
          highLevel: [],
          midLevel: [],
          lowLevel: [],
        }
      ),
    [searchResults.docs, highlighting]
  );

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

  const onInputClick: SearchInputProps['onClick'] = (ev) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling, it would close the menu
    searchResults.numFound > 0 && setIsOpen(true);
  };

  const onToggleKeyDown: SearchInputProps['onKeyDown'] = (ev) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling, it would close the menu
    if (!isOpen) {
      setIsOpen(true);
    }

    if (isOpen && ev.key === 'ArrowDown' && menuRef.current) {
      const firstElement = menuRef.current.querySelector('li > button:not(:disabled), li > a:not(:disabled)');
      firstElement && (firstElement as HTMLElement).focus();
    } else if (isOpen && ev.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleWindowResize = () => {
    const maxHeight = getMaxMenuHeight(menuRef.current);
    if (menuRef.current) {
      menuRef.current.style.maxHeight = `${maxHeight}px`;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    // make sure the menu does not overflow the screen and creates extra space bellow the main content
    window.addEventListener('resize', handleWindowResize);
    // calculate initial max height
    handleWindowResize();
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    handleWindowResize();
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, menuRef]);

  const handleFetch = (value: string) => {
    return fetch(SEARCH_QUERY.replace(REPLACE_TAG, value))
      .then((r) => r.json())
      .then(({ response, highlighting }: { highlighting: HighlightingResponseType; response: SearchResponseType }) => {
        if (isMounted.current) {
          setSearchResults(response);
          sethigHlighting(highlighting);
          // make sure to calculate resize when switching from loading to sucess state
          handleWindowResize();
        }
      })
      .finally(() => {
        isMounted.current && setIsFetching(false);
      });
  };

  const debouncedFetch = useCallback(debounce(handleFetch, 500), []);

  const handleChange = (_e: any, value: string) => {
    setSearchValue(value);
    setIsFetching(true);
    debouncedFetch(value);
  };

  const toggle = (
    <PFSearchInput
      onClick={onInputClick}
      ref={toggleRef}
      onKeyDown={onToggleKeyDown}
      placeholder="Search for services"
      value={searchValue}
      onChange={handleChange}
      className="chr-c-search__input"
      onClear={(ev) => {
        setSearchValue('');
        setSearchResults(initialSearchState);
        // make sure the input is not clicked/focused
        ev.stopPropagation();
        setIsOpen(false);
      }}
    />
  );

  const menu = (
    <Menu ref={menuRef} className="pf-u-mt-xs chr-c-search__menu">
      <MenuContent>
        <MenuList>
          {isFetching ? (
            <Bullseye className="pf-u-p-md">
              <Spinner size="xl" />
            </Bullseye>
          ) : (
            <>
              <MenuGroup label={searchResults.numFound > 0 ? `Top ${searchResults.docs.length} results` : undefined}>
                <SearchGroup highlighting={highlighting} items={resultCategories.highLevel} />
                <SearchGroup highlighting={highlighting} items={resultCategories.midLevel} />
                <SearchGroup highlighting={highlighting} items={resultCategories.lowLevel} />
              </MenuGroup>
            </>
          )}
          {searchResults.numFound === 0 && !isFetching && <EmptySearchState />}
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
