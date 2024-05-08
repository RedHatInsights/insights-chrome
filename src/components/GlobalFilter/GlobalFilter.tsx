import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import debounce from 'lodash/debounce';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../redux/actions';
import { generateFilter } from './globalFilterApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalFilterDropdown, GlobalFilterDropdownProps } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { GlobalFilterTag, GlobalFilterWorkloads, ReduxState, SID } from '../../redux/store';
import { FlagTagsFilter } from '../../@types/types';
import { isGlobalFilterAllowed } from '../../utils/common';
import InternalChromeContext from '../../utils/internalChromeContext';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useAtomValue } from 'jotai';
import { activeModuleAtom } from '../../state/atoms/activeModuleAtom';

const useLoadTags = (hasAccess = false) => {
  const navigate = useNavigate();
  const registeredWith = useSelector(({ globalFilter: { scope } }: ReduxState) => scope);
  const activeModule = useAtomValue(activeModuleAtom);
  const isDisabled = useSelector(({ globalFilter: { globalFilterHidden } }: ReduxState) => globalFilterHidden || !activeModule);
  const dispatch = useDispatch();
  return useCallback(
    debounce((activeTags: any, search: any) => {
      storeFilter(activeTags, hasAccess && !isDisabled, navigate);
      batch(() => {
        dispatch(
          fetchAllTags({
            registeredWith,
            activeTags,
            search,
          })
        );
        dispatch(
          fetchAllSIDs({
            registeredWith,
            activeTags,
            search,
          })
        );
        dispatch(
          fetchAllWorkloads({
            registeredWith,
            activeTags,
            search,
          })
        );
      });
    }, 600),
    [registeredWith, hasAccess]
  );
};

const GlobalFilter = ({ hasAccess }: { hasAccess: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const isLoaded = useSelector(({ globalFilter: { tags, sid, workloads } }: ReduxState) => tags.isLoaded && sid.isLoaded && workloads.isLoaded);
  const { count, total, tags, sid, workloads } = useSelector(
    ({ globalFilter: { tags, sid, workloads } }: ReduxState) => ({
      count: (tags.count || 0) + (sid.count || 0) + (workloads.count || 0),
      total: (tags.total || 0) + (sid.total || 0) + (workloads.total || 0),
      tags: tags.items || [],
      sid: sid.items || [],
      workloads,
    }),
    shallowEqual
  );

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
    debounce((selectedTags: FlagTagsFilter) => dispatch(globalFilterChange(selectedTags)), 600),
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
  const globalFilterRemoved = useSelector(({ globalFilter: { globalFilterRemoved } }: ReduxState) => globalFilterRemoved);
  const chromeAuth = useContext(ChromeAuthContext);
  const { pathname } = useLocation();
  const { getUserPermissions } = useContext(InternalChromeContext);

  // FIXME: Clean up the global filter display flag
  const isLanding = pathname === '/';
  const isAllowed = isGlobalFilterAllowed();
  const globalFilterHidden = useSelector(({ globalFilter: { globalFilterHidden } }: ReduxState) => globalFilterHidden);
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
