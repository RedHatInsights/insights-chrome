import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../redux/actions';
import { generateFilter } from './globalFilterApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalFilterDropdown, GlobalFilterDropdownProps } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { GlobalFilterTag, GlobalFilterWorkloads, ReduxState, SID } from '../../redux/store';
import { FlagTagsFilter } from '../../@types/types';
import { isGlobalFilterAllowed } from '../../utils/common';

const useLoadTags = (hasAccess = false) => {
  const navigate = useNavigate();
  const registeredWith = useSelector(({ globalFilter: { scope } }: ReduxState) => scope);
  const isDisabled = useSelector(({ globalFilter: { globalFilterHidden }, chrome: { appId } }: ReduxState) => globalFilterHidden || !appId);
  const dispatch = useDispatch();
  return useCallback(
    (activeTags, search) => {
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
    },
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
  const isDisabled = useSelector(({ globalFilter: { globalFilterHidden }, chrome: { appId } }: ReduxState) => globalFilterHidden || !appId);

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

  useEffect(() => {
    setValue(() => generateFilter());
  }, []);

  useEffect(() => {
    if (hasAccess && !isDisabled) {
      loadTags(selectedTags, filterTagsBy);
      dispatch(globalFilterChange(selectedTags));
    }
  }, [selectedTags, filterTagsBy, hasAccess, isDisabled]);

  return (
    <GlobalFilterDropdown
      allowed={hasAccess}
      isDisabled={isDisabled}
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
  const userLoaded = useSelector(({ chrome: { user } }: ReduxState) => Boolean(user));
  const { pathname } = useLocation();

  // FIXME: Clean up the global filter display flag
  const isLanding = pathname === '/';
  const isAllowed = isGlobalFilterAllowed();
  const isGlobalFilterEnabled = useMemo(() => {
    const globalFilterAllowed = isAllowed || globalFilterRemoved;
    return !isLanding && (globalFilterAllowed || Boolean(localStorage.getItem('chrome:experimental:global-filter')));
  }, [isLanding, isAllowed]);

  useEffect(() => {
    let mounted = true;
    const fetchPermissions = async () => {
      const permissions = await window.insights?.chrome?.getUserPermissions?.('inventory');
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
  return isGlobalFilterEnabled && userLoaded ? <GlobalFilter hasAccess={hasAccess} /> : null;
};

export default GlobalFilterWrapper;
