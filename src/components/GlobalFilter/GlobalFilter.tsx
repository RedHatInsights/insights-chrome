import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AllTag, useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import debounce from 'lodash/debounce';
import { generateFilter } from './globalFilterApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalFilterDropdown } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { sanitizeSelectedTags } from './sanitizeSelectedTags';
import { getInitialFilterState } from './getInitialFilterState';

import { isGlobalFilterAllowed } from '../../utils/common';
import InternalChromeContext from '../../utils/internalChromeContext';
import ChromeAuthContext from '../../auth/ChromeAuthContext';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  globalFilterDataAtom,
  globalFilterHiddenAtom,
  globalFilterScopeAtom,
  isGlobalFilterDisabledAtom,
  selectedTagsAtom,
  setAllLoadingAtom,
} from '../../state/atoms/globalFilterAtom';
import { getAllSIDs, getAllTags, getAllWorkloads } from './tagsApi';
import { FlagTagsFilter } from '../../@types/types';

const useLoadTags = (hasAccess = false) => {
  const navigate = useNavigate();
  const registeredWith = useAtomValue(globalFilterScopeAtom);
  const isGlobalFilterDisabled = useAtomValue(isGlobalFilterDisabledAtom);
  const setAllLoading = useSetAtom(setAllLoadingAtom);

  return useCallback(
    debounce(async (activeTags: FlagTagsFilter, search: string) => {
      // Set loading state to false before fetching (single render)
      setAllLoading(false);
      try {
        storeFilter(activeTags, hasAccess && !isGlobalFilterDisabled, navigate);
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
        // Set loaded property to true even if an error occurs (single render)
        setAllLoading(true);
      }
    }, 600),
    [registeredWith, hasAccess, isGlobalFilterDisabled, setAllLoading]
  );
};

const GlobalFilter = ({ hasAccess }: { hasAccess: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoaded, tags: tagsData, sids: sidsData, workloads: workloadsData, count, total } = useAtomValue(globalFilterDataAtom);
  const persistedSelectedTags = useAtomValue(selectedTagsAtom);
  const setSelectedTags = useSetAtom(selectedTagsAtom);
  const isInitialized = useRef(false);
  // Force CI rebuild

  const filterData: AllTag[] = useMemo(() => {
    const workloadsTags = (workloadsData.items || []).flatMap((group: any) =>
      (group.tags || []).map((item: any) => ({
        count: item.count,
        tag: item.tag,
      }))
    );

    const sidsTags = (sidsData.items || []).flatMap((group: any) =>
      (group.tags || []).map((item: any) => ({
        count: item.count,
        tag: item.tag,
      }))
    );

    const sections: AllTag[] = [];

    // Always include Workloads section (even if empty)
    sections.push({
      name: 'Workloads',
      type: 'checkbox',
      tags: workloadsTags,
    });

    // Only include SAP IDs section if it has tags
    if (sidsTags.length > 0) {
      sections.push({
        name: 'SAP IDs (SID)',
        type: 'checkbox',
        tags: sidsTags,
      });
    }

    return [
      ...sections,
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
  }, [tagsData.items, sidsData.items, workloadsData.items]);

  const { filter, chips, selectedTags, setValue, filterTagsBy } = (useTagsFilter as any)(
    // Using 'as any' to bypass complex external types
    filterData,
    isLoaded,
    total - count,
    (_e: React.MouseEvent, closeFn: () => void) => {
      setIsOpen(true);
      closeFn?.();
    },
    undefined,
    'system',
    'View more'
  );

  const loadTags = useLoadTags(hasAccess);

  // This effect syncs the hook's state to the persistent atom
  useEffect(() => {
    if (isInitialized.current) {
      const sanitized = sanitizeSelectedTags(selectedTags);
      setSelectedTags(sanitized);
    }
  }, [selectedTags, setSelectedTags]);

  // This effect initializes the hook's state FROM the atom or URL
  useEffect(() => {
    // Wait until data is loaded before initializing
    if (setValue && !isInitialized.current && isLoaded) {
      const urlFilter = generateFilter();
      const initialState = getInitialFilterState(urlFilter, persistedSelectedTags);
      setValue(initialState);
      isInitialized.current = true;
    }
  }, [setValue, persistedSelectedTags, isLoaded]);

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

  const isGlobalFilterDisabled = useAtomValue(isGlobalFilterDisabledAtom);
  const isGlobalFilterEnabled = useMemo(() => {
    if (isGlobalFilterDisabled) {
      return false;
    }
    const globalFilterAllowed = isAllowed || globalFilterRemoved;
    return !isLanding && (globalFilterAllowed || Boolean(localStorage.getItem('chrome:experimental:global-filter')));
  }, [isLanding, isAllowed, isGlobalFilterDisabled]);

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
