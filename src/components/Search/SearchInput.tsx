import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Menu, MenuContent, MenuFooter, MenuGroup, MenuItem, MenuList } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { SearchInput as PFSearchInput, SearchInputProps } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Popper } from '@patternfly/react-core/dist/dynamic/helpers/Popper/Popper';

import './SearchInput.scss';

import EmptySearchState from './EmptySearchState';
import { useSegment } from '../../analytics/useSegment';
import useWindowWidth from '../../hooks/useWindowWidth';
import ChromeLink from '../ChromeLink';
import SearchTitle from './SearchTitle';
import SearchDescription from './SearchDescription';
import { useAtomValue } from 'jotai';
import { asyncLocalOrama } from '../../state/atoms/localSearchAtom';
import { consoleSearch } from '../../utils/consoleSearch';
import { isHydraSearchEnabled } from '../../utils/hydraSearch';
import { isPreviewAtom } from '../../state/atoms/releaseAtom';
import { ReleaseEnv } from '@redhat-cloud-services/types/index.js';
import type { SearchItem } from './SearchTypes';
import SearchFeedback, { SearchFeedbackType } from './SearchFeedback';

export type SearchInputprops = {
  isExpanded?: boolean;
};

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

/** Remote (Hydra) queries are debounced; the local index is still queried on every keystroke. */
export const REMOTE_SEARCH_DEBOUNCE_MS = 200;

type SearchInputListener = {
  onStateChange: (isOpen: boolean) => void;
};

const SearchInput = ({ onStateChange }: SearchInputListener) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentFeedbackType, setcurrentFeedbackType] = useState<SearchFeedbackType>();
  const [isFetching, setIsFetching] = useState(false);
  /**
   * Results of the last successful search and the query that produced them. They stay visible while
   * newer queries are in flight (or fail) until the next successful response replaces them.
   * `undefined` means no search has succeeded since the input was last emptied.
   */
  const [lastResults, setLastResults] = useState<{ query: string; items: SearchItem[] }>();
  const searchItems = useMemo(() => lastResults?.items ?? [], [lastResults]);
  const isPreview = useAtomValue(isPreviewAtom);
  const { ready, analytics } = useSegment();
  const blockCloseEvent = useRef(false);
  const asyncLocalOramaData = useAtomValue(asyncLocalOrama);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    onStateChange(false);
  }, [onStateChange]);

  const onResultKeyDown: React.KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        setTimeout(closeMenu);
      }
    },
    [closeMenu]
  );

  const debouncedTrack = useCallback(analytics ? debounce(analytics.track, 1000) : () => null, [analytics]);

  const isMounted = useRef(false);
  const toggleRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { md } = useWindowWidth();

  const resultCount = searchItems.length;

  const { internalItems, externalItems } = useMemo(() => {
    const internalItems: SearchItem[] = [];
    const externalItems: SearchItem[] = [];
    searchItems.forEach((item) => {
      if (item.isExternal) {
        externalItems.push(item);
      } else {
        internalItems.push(item);
      }
    });
    return { internalItems, externalItems };
  }, [searchItems]);

  useEffect(() => {
    if (currentFeedbackType) {
      setcurrentFeedbackType(undefined);
    }
  }, [searchValue]);

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

  const onInputClick: SearchInputProps['onClick'] = (event) => {
    // PF attaches onClick to the whole input group, including the expand/collapse toggle; only react to the text field.
    if (!toggleRef.current?.contains(event.target as Node)) {
      return;
    }
    // Clicking into the text field must not close the menu. Can't use event.stopPropagation because it
    // would block other opened menus from triggering their close event.
    blockCloseEvent.current = true;
    // Open even without results so the default state (empty input) is reachable.
    if (!isOpen && (md || (isExpanded && searchValue !== ''))) {
      setIsOpen(true);
      onStateChange(true);
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
      if (firstElement) {
        (firstElement as HTMLElement).focus();
      }
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
  }, [isOpen, menuRef, resultCount]);

  useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleMenuKeys);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, menuRef]);

  const searchController = useRef<AbortController>();
  // Read the latest values through a ref so runSearch (and its debounced wrapper) stay stable.
  // Re-creating them would cancel an in-flight search and leave the spinner hanging.
  const searchContext = useRef({ asyncLocalOramaData, isPreview, ready, analytics, debouncedTrack });
  searchContext.current = { asyncLocalOramaData, isPreview, ready, analytics, debouncedTrack };

  const runSearch = useCallback(async (value: string) => {
    const { asyncLocalOramaData, isPreview } = searchContext.current;
    // Abort the previous request so a slow, stale response can never overwrite newer results.
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    try {
      const { results, source } = await consoleSearch({
        db: asyncLocalOramaData,
        term: value,
        env: isPreview ? ReleaseEnv.PREVIEW : ReleaseEnv.STABLE,
        type: 'services',
        signal: controller.signal,
      });
      if (controller.signal.aborted || !isMounted.current) {
        return;
      }
      setLastResults({ query: value, items: results ?? [] });
      setIsFetching(false);
      const { ready, analytics, debouncedTrack } = searchContext.current;
      if (ready && analytics) {
        debouncedTrack('chrome.search-query', { query: value, source });
      }
    } catch (error) {
      if (controller.signal.aborted || !isMounted.current) {
        return;
      }
      // Keep showing the last successful results; only a successful response replaces them.
      console.error('[chrome] Search failed:', error);
      setIsFetching(false);
    }
  }, []);

  const debouncedRemoteSearch = useMemo(() => debounce(runSearch, REMOTE_SEARCH_DEBOUNCE_MS), [runSearch]);

  const cancelSearch = useCallback(() => {
    debouncedRemoteSearch.cancel();
    searchController.current?.abort();
  }, [debouncedRemoteSearch]);

  useEffect(() => cancelSearch, [cancelSearch]);

  const resetSearch = useCallback(() => {
    cancelSearch();
    setIsFetching(false);
    setLastResults(undefined);
  }, [cancelSearch]);

  const handleChange: SearchInputProps['onChange'] = (_e, value) => {
    setSearchValue(value);
    if (value.trim().length === 0) {
      // Nothing to search for: show the default state instead of results.
      resetSearch();
      return;
    }
    setIsFetching(true);
    if (isHydraSearchEnabled()) {
      debouncedRemoteSearch(value);
    } else {
      debouncedRemoteSearch.cancel();
      runSearch(value);
    }
  };

  const [isExpanded, setIsExpanded] = React.useState(false);

  const onToggleExpand = (_event: React.SyntheticEvent<HTMLButtonElement>, isExpanded: boolean) => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      // collapsing: nothing left to show
      closeMenu();
    }
    resetSearch();
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
        resetSearch();
        setSearchValue('');
        ev.stopPropagation();
        setIsOpen(false);
        onStateChange(false);
      }}
      {...{
        expandableInput: {
          isExpanded: willExpand(),
          onToggleExpand,
          toggleAriaLabel: 'Expandable search input toggle',
        },
      }}
      onClick={onInputClick}
      ref={toggleRef}
      onKeyDown={onToggleKeyDown}
      className={classNames({
        'pf-v6-u-flex-grow-1': isExpanded,
        'pf-v6-u-justify-content-flex-end': !isExpanded,
      })}
    />
  );

  const hasQuery = searchValue.trim().length > 0;

  let menuFooter;
  if (hasQuery && lastResults && searchItems.length > 0 && !isFetching) {
    menuFooter = (
      <MenuFooter className="pf-v6-u-px-md">
        <SearchFeedback query={lastResults.query} results={searchItems} feedbackType={currentFeedbackType} onFeedbackSubmitted={setcurrentFeedbackType} />
      </MenuFooter>
    );
  }

  const menu = (
    <Menu ref={menuRef} className="pf-v6-u-pt-sm chr-c-search__menu">
      <MenuContent>
        <MenuList aria-busy={isFetching}>
          {!hasQuery ? (
            // TODO(INT-002): replace with the designed default (pre-typing) search panel state.
            <Bullseye className="pf-v6-u-p-md" data-testid="search-default-state">
              default state
            </Bullseye>
          ) : !lastResults && isFetching ? (
            // Only the very first query shows a spinner; later queries keep the last results on screen.
            <Bullseye className="pf-v6-u-p-md">
              <Spinner size="xl" />
            </Bullseye>
          ) : (
            <>
              {internalItems.length > 0 && (
                <MenuGroup label={`Top ${internalItems.length} results`}>
                  {internalItems.map((item) => (
                    <MenuItem
                      onKeyDown={onResultKeyDown}
                      key={item.id}
                      className="pf-v6-u-mb-xs"
                      component={(props) => <ChromeLink {...props} href={item.pathname} />}
                    >
                      <SearchTitle title={item.title} bundleTitle={item.bundleTitle.replace(/(\[|\])/gm, '')} className="pf-v6-u-mb-xs" />
                      <SearchDescription description={item.description} />
                    </MenuItem>
                  ))}
                </MenuGroup>
              )}
              {externalItems.length > 0 && (
                <MenuGroup label="External resources">
                  {externalItems.map((item) => (
                    <MenuItem
                      onKeyDown={onResultKeyDown}
                      key={item.id}
                      className="pf-v6-u-mb-xs"
                      component={(props) => <ChromeLink {...props} href={item.pathname} isExternal />}
                    >
                      <SearchTitle title={item.title} bundleTitle={item.bundleTitle.replace(/(\[|\])/gm, '')} className="pf-v6-u-mb-xs" isExternal />
                      <SearchDescription description={item.description} />
                    </MenuItem>
                  ))}
                </MenuGroup>
              )}
            </>
          )}
          {hasQuery && searchItems.length === 0 && (lastResults || !isFetching) && <EmptySearchState />}
        </MenuList>
      </MenuContent>
      {menuFooter}
    </Menu>
  );

  return (
    <div ref={containerRef} className="pf-v6-c-search-input pf-v6-u-w-100 pf-v6-u-align-content-center">
      <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen} />
    </div>
  );
};

export default SearchInput;
