import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { localQuery } from '../../utils/localSearch';
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

type SearchInputListener = {
  onStateChange: (isOpen: boolean) => void;
};

const SearchInput = ({ onStateChange }: SearchInputListener) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentFeedbackType, setcurrentFeedbackType] = useState<SearchFeedbackType>();
  const [isFetching, setIsFetching] = useState(false);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const isPreview = useAtomValue(isPreviewAtom);
  const { ready, analytics } = useSegment();
  const blockCloseEvent = useRef(false);
  const asyncLocalOramaData = useAtomValue(asyncLocalOrama);

  const debouncedTrack = useCallback(analytics ? debounce(analytics.track, 1000) : () => null, [analytics]);

  const isMounted = useRef(false);
  const toggleRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { md } = useWindowWidth();

  const resultCount = searchItems.length;

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

  const handleChange: SearchInputProps['onChange'] = async (_e, value) => {
    setSearchValue(value);
    setIsFetching(true);
    const results = await localQuery(asyncLocalOramaData, value, isPreview ? ReleaseEnv.PREVIEW : ReleaseEnv.STABLE, 'services');
    setSearchItems(results ?? []);
    if (isMounted.current) {
      setIsFetching(false);
    }
    if (ready && analytics) {
      debouncedTrack('chrome.search-query', { query: value });
    }
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
      className={isExpanded ? 'pf-u-flex-grow-1' : 'chr-c-search__collapsed'}
    />
  );

  let menuFooter;
  if (searchItems.length > 0 && !isFetching) {
    menuFooter = (
      <MenuFooter className="pf-v6-u-px-md">
        <SearchFeedback query={searchValue} results={searchItems} feedbackType={currentFeedbackType} onFeedbackSubmitted={setcurrentFeedbackType} />
      </MenuFooter>
    );
  }

  const menu = (
    <Menu ref={menuRef} className="pf-v6-u-pt-sm chr-c-search__menu">
      <MenuContent>
        <MenuList>
          {isFetching ? (
            <Bullseye className="pf-v6-u-p-md">
              <Spinner size="xl" />
            </Bullseye>
          ) : (
            <>
              <MenuGroup label={searchItems.length > 0 ? `Top ${searchItems.length} results` : undefined}>
                {searchItems.map((item, index) => (
                  <MenuItem
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        /**
                         * Needs pushed to the end of the execution queue to not "swallow" the event
                         * First the navigation event must execute and
                         *  */
                        setTimeout(() => {
                          setIsOpen(false);
                        });
                      }
                    }}
                    key={index}
                    className="pf-v6-u-mb-xs"
                    component={(props) => <ChromeLink {...props} href={item.pathname} />}
                  >
                    <SearchTitle title={item.title} bundleTitle={item.bundleTitle.replace(/(\[|\])/gm, '')} className="pf-v6-u-mb-xs" />
                    <SearchDescription description={item.description} />
                  </MenuItem>
                ))}
              </MenuGroup>
            </>
          )}
          {searchItems.length === 0 && !isFetching && <EmptySearchState />}
        </MenuList>
      </MenuContent>
      {menuFooter}
    </Menu>
  );

  return (
    <div ref={containerRef} className="pf-v6-c-search-input pf-v6-u-w-100 pf-v6-u-align-content-center">
      {!md && <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen} />}
      {md && <Popper trigger={toggle} popper={menu} appendTo={containerRef.current || undefined} isVisible={isOpen} />}
    </div>
  );
};

export default SearchInput;
