import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Menu, MenuContent, MenuGroup, MenuItem, MenuList } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { SearchInput as PFSearchInput, SearchInputProps } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Popper } from '@patternfly/react-core/dist/dynamic/helpers/Popper/Popper';

import debounce from 'lodash/debounce';
import uniq from 'lodash/uniq';
import uniqWith from 'lodash/uniqWith';

import './SearchInput.scss';
import { AUTOSUGGEST_TERM_DELIMITER, SearchAutoSuggestionResponseType, SearchAutoSuggestionResultItem, SearchResponseType } from './SearchTypes';
import EmptySearchState from './EmptySearchState';
import { isProd } from '../../utils/common';
import { useSegment } from '../../analytics/useSegment';
import useWindowWidth from '../../hooks/useWindowWidth';
import ChromeLink from '../ChromeLink';
import SearchTitle from './SearchTitle';
import SearchDescription from './SearchDescription';

export type SearchInputprops = {
  isExpanded?: boolean;
};

const IS_PROD = isProd();
const REPLACE_TAG = 'REPLACE_TAG';
const REPLACE_COUNT_TAG = 'REPLACE_COUNT_TAG';
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
BASE_SEARCH.append('q', `alt_titles:${REPLACE_TAG}`); // add query replacement tag and enable fuzzy search with ~ and wildcards
BASE_SEARCH.append('fq', 'documentKind:ModuleDefinition'); // search for ModuleDefinition documents
BASE_SEARCH.append('rows', `${REPLACE_COUNT_TAG}`); // request 10 results

const BASE_URL = new URL(`https://access.${IS_PROD ? '' : 'stage.'}redhat.com/hydra/rest/search/platform/console/`);
// search API stopped receiving encoded search string
BASE_URL.search = decodeURIComponent(BASE_SEARCH.toString());

const SUGGEST_SEARCH = new URLSearchParams();
SUGGEST_SEARCH.append('redhat_client', 'console'); // required client id
SUGGEST_SEARCH.append('q', REPLACE_TAG); // add query replacement tag and enable fuzzy search with ~ and wildcards
SUGGEST_SEARCH.append('suggest.count', '10'); // request 10 results
SUGGEST_SEARCH.append('suggest.dictionary', 'improvedInfixSuggester'); // console  new suggest dictionary
SUGGEST_SEARCH.append('suggest.dictionary', 'default');

const SUGGEST_URL = new URL(`https://access.${IS_PROD ? '' : 'stage.'}redhat.com/hydra/proxy/gss-diag/rs/search/autosuggest`);
// search API stopped receiving encoded search string
SUGGEST_URL.search = decodeURIComponent(SUGGEST_SEARCH.toString());
const SUGGEST_SEARCH_QUERY = SUGGEST_URL.toString();

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

type SearchItem = {
  title: string;
  bundleTitle: string;
  description: string;
  pathname: string;
};

type SearchInputListener = {
  onStateChange: (isOpen: boolean) => void;
};

function parseSuggestions(suggestions: SearchAutoSuggestionResultItem[] = []) {
  return suggestions.map((suggestion) => {
    const [allTitle, bundleTitle, abstract] = suggestion.term.split(AUTOSUGGEST_TERM_DELIMITER);
    const url = new URL(suggestion.payload);
    return {
      item: {
        title: allTitle,
        bundleTitle,
        description: abstract,
        pathname: url.pathname,
      },
      allTitle,
    };
  });
}

const SearchInput = ({ onStateChange }: SearchInputListener) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const { ready, analytics } = useSegment();
  const blockCloseEvent = useRef(false);

  const isMounted = useRef(false);
  const toggleRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { md } = useWindowWidth();

  const resultCount = searchItems.length;

  const handleMenuKeys = (event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }
    if (menuRef.current?.contains(event.target as Node) || toggleRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsOpen(!isOpen);
        onStateChange(!isOpen);
        toggleRef.current?.focus();
      }
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (!blockCloseEvent.current && isOpen && !menuRef.current?.contains(event.target as Node)) {
      setIsOpen(false);
      onStateChange(false);
    }
    // unblock the close event to prevent unwanted hanging dropdown menu on subsequent input clicks
    blockCloseEvent.current = false;
  };

  const onInputClick: SearchInputProps['onClick'] = () => {
    if (!isOpen && resultCount > 0) {
      if (!md && isExpanded && searchValue !== '') {
        setIsOpen(true);
        onStateChange(true);
      } else if (md) {
        setIsOpen(true);
        onStateChange(true);
      }
      // can't use event.stoppropagation because it will block other opened menus from triggering their close event
      blockCloseEvent.current = true;
    }
  };

  const onToggleKeyDown: SearchInputProps['onKeyDown'] = (ev) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling, it would close the menu
    if (!isOpen) {
      setIsOpen(true);
      onStateChange(true);
    }

    if (isOpen && ev.key === 'ArrowDown' && menuRef.current) {
      const firstElement = menuRef.current.querySelector('li > button:not(:disabled), li > a:not(:disabled)');
      firstElement && (firstElement as HTMLElement).focus();
    } else if (isOpen && ev.key === 'Escape') {
      setIsOpen(false);
      onStateChange(false);
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

  const handleFetch = async (value = '') => {
    const response = (await fetch(SUGGEST_SEARCH_QUERY.replaceAll(REPLACE_TAG, value)).then((r) => r.json())) as SearchAutoSuggestionResponseType;

    // parse default suggester
    // parse improved suggester
    let items: { item: SearchItem; allTitle: string }[] = [];
    items = items
      .concat(
        parseSuggestions(response?.suggest?.default[value]?.suggestions),
        parseSuggestions(response?.suggest?.improvedInfixSuggester[value]?.suggestions)
      )
      .slice(0, 10);
    const suggests = uniq(items.map(({ allTitle }) => allTitle.replace(/(<b>|<\/b>)/gm, '').trim()));
    let searchItems = items.map(({ item }) => item);
    if (items.length < 10) {
      const altTitleResults = (await fetch(
        BASE_URL.toString()
          .replaceAll(REPLACE_TAG, `(${suggests.length > 0 ? suggests.join(' OR ') + ' OR ' : ''}${value})`)
          .replaceAll(REPLACE_COUNT_TAG, '10')
      ).then((r) => r.json())) as { response: SearchResponseType };
      searchItems = searchItems.concat(
        altTitleResults.response.docs.map((doc) => ({
          pathname: doc.relative_uri,
          bundleTitle: doc.bundle_title[0],
          title: doc.allTitle,
          description: doc.abstract,
        }))
      );
    }
    searchItems = uniqWith(searchItems, (a, b) => a.title.replace(/(<b>|<\/b>)/gm, '').trim() === b.title.replace(/(<b>|<\/b>)/gm, '').trim());
    setSearchItems(searchItems.slice(0, 10));
    isMounted.current && setIsFetching(false);
    if (ready && analytics) {
      analytics.track('chrome.search-query', { query: value });
    }
  };

  const debouncedFetch = useCallback(debounce(handleFetch, 500), []);

  const handleChange: SearchInputProps['onChange'] = (_e, value) => {
    setSearchValue(value);
    setIsFetching(true);
    debouncedFetch(value);
  };

  const [isExpanded, setIsExpanded] = React.useState(false);

  const onToggleExpand = (_event: React.SyntheticEvent<HTMLButtonElement>, isExpanded: boolean) => {
    setIsExpanded(!isExpanded);
    setSearchValue('');
  };

  const willExpand = () => {
    const expanded = isExpanded || searchValue !== '';
    if (expanded !== isExpanded) {
      setIsExpanded(expanded);
    }
    return expanded;
  };

  const toggle = (
    <PFSearchInput
      placeholder="Search for services"
      value={searchValue}
      onChange={handleChange}
      onClear={(ev) => {
        setSearchValue('');
        setSearchItems([]);
        ev.stopPropagation();
        setIsOpen(false);
        onStateChange(false);
      }}
      {...(!md && {
        expandableInput: {
          isExpanded: willExpand(),
          onToggleExpand,
          toggleAriaLabel: 'Expandable search input toggle',
        },
      })}
      onClick={onInputClick}
      ref={toggleRef}
      onKeyDown={onToggleKeyDown}
      className={isExpanded ? 'pf-u-flex-grow-1' : 'chr-c-search__collapsed'}
    />
  );
  const menu = (
    <Menu ref={menuRef} className="pf-v5-u-pt-sm pf-v5-u-px-md chr-c-search__menu">
      <MenuContent>
        <MenuList>
          {isFetching ? (
            <Bullseye className="pf-v5-u-p-md">
              <Spinner size="xl" />
            </Bullseye>
          ) : (
            <>
              <MenuGroup label={searchItems.length > 0 ? `Top ${searchItems.length} results` : undefined}>
                {searchItems.map((item, index) => (
                  <MenuItem key={index} className="pf-v5-u-mb-xs" component={(props) => <ChromeLink {...props} href={item.pathname} />}>
                    <SearchTitle title={item.title} bundleTitle={item.bundleTitle.replace(/(\[|\])/gm, '')} />
                    <SearchDescription description={item.description} />
                  </MenuItem>
                ))}
              </MenuGroup>
            </>
          )}
          {searchItems.length === 0 && !isFetching && <EmptySearchState />}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  return (
    <div ref={containerRef} className="chr-c-search__input pf-v5-c-search-input pf-v5-u-w-100">
      {!md && <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen} />}
      {md && <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen} />}
    </div>
  );
};

export default SearchInput;
