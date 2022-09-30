import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../redux/actions';
import { generateFilter } from './constants';
import { useHistory } from 'react-router-dom';
import { GlobalFilterDropdown } from './GlobalFilterMenu';
import { storeFilter } from './filterApi';

const useLoadTags = (hasAccess) => {
  const history = useHistory();
  const registeredWith = useSelector(({ globalFilter: { scope } }) => scope);
  const isDisabled = useSelector(({ globalFilter: { globalFilterHidden }, chrome: { appId } }) => globalFilterHidden || !appId);
  const dispatch = useDispatch();
  return useCallback(
    (activeTags, search) => {
      storeFilter(activeTags, hasAccess && !isDisabled, history);
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
    [registeredWith, hasAccess, history]
  );
};

const GlobalFilter = ({ hasAccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const isLoaded = useSelector(({ globalFilter: { tags, sid, workloads } }) => tags.isLoaded && sid.isLoaded && workloads.isLoaded);
  const { count, total, tags, sid, workloads } = useSelector(
    ({ globalFilter: { tags, sid, workloads } }) => ({
      count: tags.count + sid.count + workloads.count,
      total: tags.total + sid.total + workloads.total,
      tags: tags.items || [],
      sid: sid.items || [],
      workloads,
    }),
    shallowEqual
  );
  const isDisabled = useSelector(({ globalFilter: { globalFilterHidden }, chrome: { appId } }) => globalFilterHidden || !appId);

  const { filter, chips, selectedTags, setValue, filterTagsBy } = useTagsFilter(
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
  );

  const loadTags = useLoadTags(hasAccess);

  useEffect(() => {
    setValue(() => generateFilter());
  }, []);

  useEffect(() => {
    if (hasAccess && !isDisabled) {
      loadTags(selectedTags, filterTagsBy, true);
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
      setIsOpen={setIsOpen}
    />
  );
};

GlobalFilter.propTypes = {
  hasAccess: PropTypes.bool,
};

const GlobalFilterWrapper = () => {
  const [hasAccess, setHasAccess] = useState(undefined);
  useEffect(() => {
    const fetchPermissions = async () => {
      const permissions = await window.insights?.chrome?.getUserPermissions('inventory');
      setHasAccess(permissions?.some((item) => ['inventory:*:*', 'inventory:*:read', 'inventory:hosts:read'].includes(item?.permission || item)));
    };
    fetchPermissions();
  }, []);
  const userLoaded = useSelector(({ chrome: { user } }) => Boolean(user));
  return userLoaded ? <GlobalFilter hasAccess={hasAccess} /> : null;
};

export default GlobalFilterWrapper;
