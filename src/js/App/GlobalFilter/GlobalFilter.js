import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../redux/actions';
import { Button, Chip, ChipGroup, Divider, Split, SplitItem, Tooltip } from '@patternfly/react-core';
import TagsModal from './TagsModal';
import { generateFilter, updateSelected } from './constants';
import { useHistory } from 'react-router-dom';
import GlobalFilterMenu from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const GlobalFilterDropdown = ({ allowed, isDisabled, filter, chips, setValue, selectedTags, isOpen, filterTagsBy, setIsOpen }) => {
  /**
   * Hotjar API reference: https://help.hotjar.com/hc/en-us/articles/4405109971095-Events-API-Reference#the-events-api-call
   * window.hj is only avaiable in console.redhat.com and console.redhat.com/beta
   * We are unable to test it in any local development environment
   * */
  const hotjarEventEmitter = typeof window.hj === 'function' ? window.hj : () => undefined;
  const registeredWith = useSelector(({ globalFilter: { scope } }) => scope);
  const userLoaded = useSelector(({ chrome: { user } }) => Boolean(user));
  const intl = useIntl();
  const dispatch = useDispatch();
  const GroupFilterWrapper = useMemo(
    () => (!allowed || isDisabled ? Tooltip : ({ children }) => <Fragment>{children}</Fragment>),
    [allowed, isDisabled]
  );
  return (
    <Fragment>
      <Split id="global-filter" hasGutter className="chr-c-global-filter">
        <SplitItem>
          {userLoaded && allowed !== undefined ? (
            <GroupFilterWrapper
              {...((!allowed || isDisabled) && {
                content: !allowed
                  ? `${intl.formatMessage(messages.noInventoryPermissions)}`
                  : `${intl.formatMessage(messages.globalFilterNotApplicable)}`,
                position: 'right',
              })}
            >
              <GlobalFilterMenu
                setTagModalOpen={setIsOpen}
                hotjarEventEmitter={hotjarEventEmitter}
                {...filter}
                selectedTags={selectedTags}
                isDisabled={!allowed || isDisabled}
                placeholder={intl.formatMessage(messages.filterResults)}
              />
            </GroupFilterWrapper>
          ) : (
            <Skeleton size={SkeletonSize.xl} />
          )}
        </SplitItem>
        {allowed && (
          <SplitItem isFilled>
            {chips?.length > 0 && (
              <Fragment>
                {chips.map(({ category, chips }, key) => (
                  <ChipGroup key={key} categoryName={category} className={category === 'Workloads' ? 'chr-c-chip' : ''}>
                    {chips?.map(({ key: chipName, tagKey, value }, chipKey) => (
                      <Chip
                        key={chipKey}
                        onClick={() => setValue(() => updateSelected(selectedTags, category, chipName, value, false))}
                        isReadOnly={isDisabled}
                      >
                        {tagKey}
                        {value ? `=${value}` : ''}
                      </Chip>
                    ))}
                  </ChipGroup>
                ))}
                {!isDisabled && (
                  <Button variant="link" ouiaId="global-filter-clear" onClick={() => setValue(() => ({}))}>
                    {intl.formatMessage(messages.clearFilters)}
                  </Button>
                )}
              </Fragment>
            )}
          </SplitItem>
        )}
      </Split>
      {isOpen && (
        <TagsModal
          isOpen={isOpen}
          filterTagsBy={filterTagsBy}
          selectedTags={selectedTags}
          toggleModal={(isSubmit) => {
            if (!isSubmit) {
              dispatch(
                fetchAllTags({
                  registeredWith,
                  activeTags: selectedTags,
                  search: filterTagsBy,
                })
              );
            }
            hotjarEventEmitter('event', 'global_filter_bulk_action');
            setIsOpen(false);
          }}
          onApplyTags={(selected, sidSelected) => {
            setValue(() =>
              [...(selected || []), ...(sidSelected || [])].reduce(
                (acc, { namespace, key, value }) =>
                  updateSelected(acc, namespace, `${key}${value ? `=${value}` : ''}`, value, true, { item: { tagKey: key } }),
                selectedTags
              )
            );
          }}
        />
      )}
      <Divider />
    </Fragment>
  );
};

GlobalFilterDropdown.propTypes = {
  allowed: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool,
  filter: PropTypes.object,
  chips: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      chips: PropTypes.arrayOf(
        PropTypes.shape({ key: PropTypes.string.isRequired, tagKey: PropTypes.string.isRequired, value: PropTypes.node.isRequired })
      ),
    })
  ),
  setValue: PropTypes.func.isRequired,
  selectedTags: PropTypes.object,
  isOpen: PropTypes.bool,
  filterTagsBy: PropTypes.string,
  setIsOpen: PropTypes.func.isRequired,
};

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
