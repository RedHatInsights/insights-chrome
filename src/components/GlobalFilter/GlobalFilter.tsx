import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AllTag, useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import debounce from 'lodash/debounce';
import { generateFilter } from './globalFilterApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalFilterDropdown } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { FlagTagsFilter } from '../../@types/types';
import { isGlobalFilterAllowed } from '../../utils/common';
import InternalChromeContext from '../../utils/internalChromeContext';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useAtomValue, useSetAtom } from 'jotai';
import {
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

const useLoadTags = (
  hasAccess = false,
  setTags: ReturnType<typeof useSetAtom<typeof tagsAtom>>,
  setSids: ReturnType<typeof useSetAtom<typeof sidsAtom>>,
  setWorkloads: ReturnType<typeof useSetAtom<typeof workloadsAtom>>
) => {
  const navigate = useNavigate();
  const registeredWith = useAtomValue(registeredWithAtom);
  const isDisabled = useAtomValue(isDisabledAtom);
  return useCallback(
    debounce(async (activeTags: any, search: any) => {
      // Set loading state to false before fetching
      setTags((prev) => ({ ...prev, isLoaded: false }));
      setSids((prev) => ({ ...prev, isLoaded: false }));
      setWorkloads((prev) => ({ ...prev, isLoaded: false }));
      try {
        storeFilter(activeTags, hasAccess && !isDisabled, navigate);
        await Promise.all([
          getAllTags({
            registeredWith,
            activeTags,
            search,
          }),
          getAllSIDs({
            registeredWith,
            activeTags,
            search,
          }),
          getAllWorkloads({
            registeredWith,
            activeTags,
            search,
          }),
        ]);
      } catch (error) {
        console.error('Failed to load global filter tags:', error);
      } finally {
        // Set loaded property to true even if an error occurs
        setTags((prev) => ({ ...prev, isLoaded: true }));
        setSids((prev) => ({ ...prev, isLoaded: true }));
        setWorkloads((prev) => ({ ...prev, isLoaded: true }));
      }
    }, 600),
    [registeredWith, hasAccess]
  );
};

const GlobalFilter = ({ hasAccess }: { hasAccess: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLoaded = useAtomValue(isLoadedAtom);
  const tagsData = useAtomValue(tagsAtom);
  const sidsData = useAtomValue(sidsAtom);
  const workloadsData = useAtomValue(workloadsAtom);
  const setSelectedTags = useSetAtom(selectedTagsAtom);

  const setTags = useSetAtom(tagsAtom);
  const setSids = useSetAtom(sidsAtom);
  const setWorkloads = useSetAtom(workloadsAtom);

  const count = (tagsData.count || 0) + (sidsData.count || 0) + (workloadsData.count || 0);
  const total = (tagsData.total || 0) + (sidsData.total || 0) + (workloadsData.total || 0);

  const filterData: AllTag[] = [
    {
      name: 'Workloads',
      type: 'checkbox',
      // Map the simple items into the required { count, tag: { key, value } } structure
      tags: (workloadsData.items || []).map((item) => ({
        count: item.count,
        tag: { key: item.key, value: item.value },
      })),
    },
    {
      name: 'SAP IDs (SID)',
      type: 'checkbox',
      tags: (sidsData.items || []).map((item: any) => ({
        count: item.count,
        tag: { key: item.key, value: item.value },
      })),
    },
    {
      name: 'Tags',
      type: 'checkbox',
      tags: (tagsData.items || []).map((item: any) => ({
        count: item.count,
        tag: { key: item.key, value: item.value },
      })),
    },
  ];

  const { filter, chips, selectedTags, setValue, filterTagsBy } = (useTagsFilter as any)(
    // Using 'as any' to bypass complex external types
    filterData,
    isLoaded,
    total - count,
    (_e: React.MouseEvent, closeFn: () => void) => {
      setIsOpen(true);
      closeFn && closeFn();
    },
    undefined,
    'system',
    'View more'
  );

  const loadTags = useLoadTags(hasAccess, setTags, setSids, setWorkloads);
  const selectTags = useCallback(
    debounce((selectedTags: FlagTagsFilter) => setSelectedTags(selectedTags), 600),
    [setSelectedTags]
  );

  useEffect(() => {
    if (setValue) {
      setValue(() => generateFilter());
    }
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
      chips={[...chips.filter(({ key }: { key: string }) => key === 'Workloads'), ...chips.filter(({ key }: { key: string }) => key !== 'Workloads')]}
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
