import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import debounce from 'lodash/debounce';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../state/actions/globalFilterActions';
import { generateFilter } from './globalFilterApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalFilterDropdown, GlobalFilterDropdownProps } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { GlobalFilterTag, GlobalFilterWorkloads, SID } from '../../@types/types';
import { FlagTagsFilter } from '../../@types/types';
import { isGlobalFilterAllowed } from '../../utils/common';
import InternalChromeContext from '../../utils/internalChromeContext';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useAtomValue } from 'jotai';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';
import { globalFilterReducerAtom } from '../../state/atoms/globalFilterAtom';
import useGlobalFilterState from '../../hooks/useGlobalFilterState';

const useLoadTags = (hasAccess = false) => {
  const navigate = useNavigate();
  const globalFilterState = useAtomValue(globalFilterReducerAtom);
  const registeredWith = globalFilterState.scope;
  const activeModule = useAtomValue(activeModuleAtom);
  const isDisabled = globalFilterState.globalFilterHidden || !activeModule;
  return useCallback(
    debounce((activeTags: any, search: any) => {
      storeFilter(activeTags, hasAccess && !isDisabled, navigate);
      // will removing the batch here cause problems? they are all fetches
      // https://github.com/pmndrs/jotai/discussions/2416
      fetchAllTags({
        registeredWith,
        activeTags,
        search,
      });
      fetchAllSIDs({
        registeredWith,
        activeTags,
        search,
      });
      fetchAllWorkloads({
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
  const { count, total, tags, sid, workloads, isLoaded } = useGlobalFilterState();

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
    debounce((selectedTags: FlagTagsFilter) => globalFilterChange(selectedTags), 600),
    [globalFilterChange]
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
  const globalFilterState = useAtomValue(globalFilterReducerAtom);
  const globalFilterRemoved = globalFilterState.globalFilterRemoved;
  const chromeAuth = useContext(ChromeAuthContext);
  const { pathname } = useLocation();
  const { getUserPermissions } = useContext(InternalChromeContext);

  // FIXME: Clean up the global filter display flag
  const isLanding = pathname === '/';
  const isAllowed = isGlobalFilterAllowed();
  const globalFilterHidden = globalFilterState.globalFilterHidden;
  const activeModule = useAtomValue(activeModuleAtom);
  const isDisabled = globalFilterHidden || !activeModule;
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
