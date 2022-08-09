import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../redux/actions';
import { Button, Chip, ChipGroup, Divider, Split, SplitItem, Tooltip } from '@patternfly/react-core';
import TagsModal from './TagsModal';
import { generateFilter, updateSelected, workloads } from './constants';
import debounce from 'lodash/debounce';
import { useHistory } from 'react-router-dom';
import GlobalFilterMenu from './GlobalFilterMenu';
import { storeFilter } from './filterApi';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const GlobalFilterDropdown = ({
  isAllowed,
  isDisabled,
  userLoaded,
  filter,
  chips,
  setValue,
  selectedTags,
  isOpen,
  filterTagsBy,
  filterScope,
  setIsOpen,
}) => {
  /**
   * Hotjar API reference: https://help.hotjar.com/hc/en-us/articles/4405109971095-Events-API-Reference#the-events-api-call
   * window.hj is only avaiable in console.redhat.com and console.redhat.com/beta
   * We are unable to test it in any local development environment
   * */
  const hotjarEventEmitter = typeof window.hj === 'function' ? window.hj : () => undefined;
  const intl = useIntl();
  const allowed = isAllowed();
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
                  registeredWith: filterScope,
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
  isAllowed: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
  userLoaded: PropTypes.bool,
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
  filterScope: PropTypes.string,
  setIsOpen: PropTypes.func.isRequired,
};

const GlobalFilter = () => {
  const [hasAccess, setHasAccess] = useState(undefined);
  const firstLoad = useRef(true);

  const isAllowed = () => hasAccess;
  const history = useHistory();

  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState();
  const dispatch = useDispatch();
  const { isLoaded, count, total, sapCount, aapCount, mssqlCount, isDisabled } = useSelector(
    ({ globalFilter: { tags, sid, workloads, globalFilterHidden }, chrome: { appId } }) => ({
      isLoaded: tags.isLoaded && sid.isLoaded && workloads.isLoaded,
      count: tags.count + sid.count + workloads.count,
      total: tags.total + sid.total + workloads.total,
      sapCount: workloads.hasSap,
      aapCount: workloads.hasAap,
      mssqlCount: workloads.hasMssql,
      isDisabled: globalFilterHidden || !appId,
    }),
    shallowEqual
  );
  const tags = useSelector(({ globalFilter: { tags } }) => tags.items || [], shallowEqual);
  const sid = useSelector(({ globalFilter: { sid } }) => sid.items || [], shallowEqual);
  const userLoaded = useSelector(({ chrome: { user } }) => Boolean(user));
  const filterScope = useSelector(({ globalFilter: { scope } }) => scope);

  const loadTags = (selectedTags, filterScope, filterTagsBy, token, firstLoad) => {
    storeFilter(selectedTags, token, isAllowed() && !isDisabled && userLoaded, history, firstLoad);
    batch(() => {
      dispatch(
        fetchAllTags({
          registeredWith: filterScope,
          activeTags: selectedTags,
          search: filterTagsBy,
        })
      );
      dispatch(
        fetchAllSIDs({
          registeredWith: filterScope,
          activeTags: selectedTags,
          search: filterTagsBy,
        })
      );
      dispatch(
        fetchAllWorkloads({
          registeredWith: filterScope,
          activeTags: selectedTags,
          search: filterTagsBy,
        })
      );
    });
  };
  const debouncedLoadTags = useCallback(debounce(loadTags, 800), []);
  const { filter, chips, selectedTags, setValue, filterTagsBy } = useTagsFilter(
    [...workloads, ...sid, ...tags],
    isLoaded && Boolean(token),
    total - count,
    (_e, closeFn) => {
      setIsOpen(() => true);
      closeFn && closeFn();
    },
    undefined,
    'system',
    'View more'
  );

  useEffect(() => {
    (async () => {
      const permissions = await window.insights?.chrome?.getUserPermissions('inventory');
      setHasAccess(permissions?.some((item) => ['inventory:*:*', 'inventory:*:read', 'inventory:hosts:read'].includes(item?.permission || item)));
    })();
  }, [userLoaded]);

  useEffect(() => {
    if (!token && userLoaded) {
      (async () => {
        const [data, currToken] = await generateFilter();
        setValue(() => data);
        setToken(() => currToken);
      })();
    } else if (userLoaded && token && isAllowed() && !isDisabled) {
      loadTags(selectedTags, filterScope, filterTagsBy, token, firstLoad.current);
      firstLoad.current = false;
    }
  }, [selectedTags, filterScope, userLoaded, isAllowed(), isDisabled]);

  useEffect(() => {
    if (userLoaded && isAllowed()) {
      debouncedLoadTags(selectedTags, filterScope, filterTagsBy, token, firstLoad.current);
    }
  }, [filterTagsBy]);

  useEffect(() => {
    if (userLoaded && token && isAllowed()) {
      dispatch(globalFilterChange(selectedTags));
    }
  }, [selectedTags, isAllowed()]);

  useEffect(() => {
    const sapTag = workloads?.[0]?.tags?.[0];
    if (typeof sapCount === 'number' && sapTag) {
      sapTag.count = sapCount;
    }
  }, [sapCount]);

  useEffect(() => {
    const aapTag = workloads?.[0]?.tags?.[1];
    if (typeof aapCount === 'number' && aapTag) {
      aapTag.count = aapCount;
    }
  }, [aapCount]);

  useEffect(() => {
    const mssqlTag = workloads?.[0]?.tags?.[2];
    if (typeof mssqlCount === 'number' && mssqlTag) {
      mssqlTag.count = mssqlCount;
    }
  }, [mssqlCount]);

  const workloadsChip = chips?.splice(
    chips?.findIndex(({ key }) => key === 'Workloads'),
    1
  );
  chips?.splice(0, 0, ...(workloadsChip || []));
  return (
    <GlobalFilterDropdown
      isAllowed={isAllowed}
      isDisabled={isDisabled}
      userLoaded={userLoaded}
      filter={filter}
      chips={chips}
      setValue={setValue}
      selectedTags={selectedTags}
      isOpen={isOpen}
      filterTagsBy={filterTagsBy}
      filterScope={filterScope}
      setIsOpen={setIsOpen}
    />
  );
};

export default memo(GlobalFilter);
