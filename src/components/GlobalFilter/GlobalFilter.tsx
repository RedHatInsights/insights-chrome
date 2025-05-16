import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import debounce from 'lodash/debounce';
import { generateFilter } from './globalFilterApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalFilterDropdown, GlobalFilterDropdownProps } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { FlagTagsFilter } from '../../@types/types';
import { isGlobalFilterAllowed } from '../../utils/common';
import InternalChromeContext from '../../utils/internalChromeContext';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  GlobalFilterTag,
  GlobalFilterWorkloads,
  SID,
  globalFilterHiddenAtom,
  isDisabledAtom,
  isLoadedAtom,
  registeredWithAtom,
  selectedTagsAtom,
  sidsAtom,
  tagsAtom,
  workloadsAtom,
} from '../../state/atoms/globalFilterAtom';
import { getAllSIDs, getAllTags, getAllWorkloads } from './tagsApi';

const useLoadTags = (hasAccess = false) => {
  const navigate = useNavigate();
  const registeredWith = useAtomValue(registeredWithAtom);
  const isDisabled = useAtomValue(isDisabledAtom);
  return useCallback(
    debounce((activeTags: any, search: any) => {
      storeFilter(activeTags, hasAccess && !isDisabled, navigate);
      getAllTags({
        registeredWith,
        activeTags,
        search,
      });
      getAllSIDs({
        registeredWith,
        activeTags,
        search,
      });
      getAllWorkloads({
        registeredWith,
        activeTags,
        search,
      });
    }, 600),
    [registeredWith, hasAccess]
  );
};

const GlobalFilter = ({ hasAccess }: { hasAccess: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLoaded = useAtomValue(isLoadedAtom);
  const tagsData = useAtomValue(tagsAtom);
  const sidsData = useAtomValue(sidsAtom);
  const workloads = useAtomValue(workloadsAtom);
  const setSelectedTags = useSetAtom(selectedTagsAtom);

  const count = (tagsData.count || 0) + (sidsData.count || 0) + (workloads.count || 0);
  const total = (tagsData.total || 0) + (sidsData.total || 0) + (workloads.total || 0);
  const tags = tagsData.items || [];
  const sid = sidsData.items || [];

  const { filter, chips, selectedTags, setValue, filterTagsBy } = (
    useTagsFilter as unknown as (
      tags: (GlobalFilterWorkloads | SID | GlobalFilterTag)[],
      isLoaded: boolean,
      count: number,
      onShowMoreClick: (event: React.MouseEvent, callback: (...args: any[]) => any) => void,
      reducer?: any,
      itemText?: React.ReactNode,
      showMoreTitle?: React.ReactNode
    ) => {
      filter: GlobalFilterDropdownProps['filter'];
      chips: GlobalFilterDropdownProps['chips'];
      selectedTags: FlagTagsFilter;
      setValue: GlobalFilterDropdownProps['setValue'];
      filterTagsBy: string;
    }
  )(
    [workloads, ...sid, ...tags],
    isLoaded,
    total - count,
    (_e, closeFn) => {
      setIsOpen(() => true);
      closeFn && closeFn();
    },
    undefined,
    'system',
    'View more'
  ); // TODO: Fix types in FEC

  const loadTags = useLoadTags(hasAccess);
  const selectTags = useCallback(
    debounce((selectedTags: FlagTagsFilter) => setSelectedTags(selectedTags), 600),
    [setSelectedTags]
  );

  useEffect(() => {
    setValue(() => generateFilter());
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadTags(selectedTags, filterTagsBy);
      selectTags(selectedTags);
    }
  }, [selectedTags, filterTagsBy, hasAccess]);

  return (
    <GlobalFilterDropdown
      allowed={hasAccess}
      filter={filter}
      chips={[...chips.filter(({ key }) => key === 'Workloads'), ...chips.filter(({ key }) => key !== 'Workloads')]}
      setValue={setValue}
      selectedTags={selectedTags}
      isOpen={isOpen}
      filterTagsBy={filterTagsBy}
      setIsOpen={(isOpen) => setIsOpen(!!isOpen)}
    />
  );
};

const GlobalFilterWrapper = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const globalFilterRemoved = useAtomValue(globalFilterHiddenAtom);
  const chromeAuth = useContext(ChromeAuthContext);
  const { pathname } = useLocation();
  const { getUserPermissions } = useContext(InternalChromeContext);

  // FIXME: Clean up the global filter display flag
  const isLanding = pathname === '/';
  const isAllowed = isGlobalFilterAllowed();

  const isDisabled = useAtomValue(isDisabledAtom);
  const isGlobalFilterEnabled = useMemo(() => {
    if (isDisabled) {
      return false;
    }
    const globalFilterAllowed = isAllowed || globalFilterRemoved;
    return !isLanding && (globalFilterAllowed || Boolean(localStorage.getItem('chrome:experimental:global-filter')));
  }, [isLanding, isAllowed, isDisabled]);

  useEffect(() => {
    let mounted = true;
    const fetchPermissions = async () => {
      const permissions = await getUserPermissions?.('inventory');
      if (mounted) {
        setHasAccess(
          permissions?.some((item) =>
            ['inventory:*:*', 'inventory:*:read', 'inventory:hosts:read'].includes((typeof item === 'string' && item) || item?.permission)
          )
        );
      }
    };
    fetchPermissions();
    return () => {
      mounted = false;
    };
  }, []);
  return isGlobalFilterEnabled && chromeAuth.ready ? <GlobalFilter hasAccess={hasAccess} /> : null;
};

export default GlobalFilterWrapper;
