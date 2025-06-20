import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AllTag, useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import debounce from 'lodash/debounce';
import { generateFilter } from './globalFilterApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalFilterDropdown } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';

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
      tags: (workloadsData.items || []).flatMap((group: any) =>
        (group.tags || []).map((item: any) => ({
          count: item.count,
          tag: item.tag,
        }))
      ),
    },
    {
      name: 'SAP IDs (SID)',
      type: 'checkbox',
      tags: (sidsData.items || []).flatMap((group: any) =>
        (group.tags || []).map((item: any) => ({
          count: item.count,
          tag: item.tag,
        }))
      ),
    },
    // Create separate AllTag sections for each namespace to enable grouping
    ...(tagsData.items || []).reduce((acc: any[], group: any) => {
      // Group tags by namespace
      const tagsByNamespace = (group.tags || []).reduce((nsAcc: any, item: any) => {
        const namespace = item.tag.namespace || 'Default';
        if (!nsAcc[namespace]) {
          nsAcc[namespace] = [];
        }
        nsAcc[namespace].push({
          count: item.count,
          tag: item.tag,
        });
        return nsAcc;
      }, {});

      // Create an AllTag section for each namespace
      Object.entries(tagsByNamespace).forEach(([namespace, tags]: [string, any]) => {
        acc.push({
          name: namespace, // This should create the header
          type: 'checkbox',
          tags: tags,
        });
      });

      return acc;
    }, []),
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

  // Update the atom when selectedTags from hook changes
  useEffect(() => {
    setSelectedTags(selectedTags);
  }, [selectedTags, setSelectedTags]);

  useEffect(() => {
    if (setValue) {
      setValue(generateFilter());
    }
  }, [setValue]); // Only depend on setValue, not on every change

  useEffect(() => {
    if (hasAccess) {
      loadTags(selectedTags, filterTagsBy);
    }
  }, [selectedTags, filterTagsBy, hasAccess, loadTags]);

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
