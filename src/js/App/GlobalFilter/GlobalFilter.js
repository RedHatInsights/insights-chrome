import React, { useEffect, Fragment, useState, useCallback, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, batch, shallowEqual } from 'react-redux';
import { GroupFilter } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/FilterHooks';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../redux/actions';
import { Button, Chip, ChipGroup, Split, SplitItem, Tooltip } from '@patternfly/react-core';
import TagsModal from './TagsModal';
import { workloads, updateSelected, storeFilter, generateFilter } from './constants';
import debounce from 'lodash/debounce';
import { useHistory } from 'react-router-dom';

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
  const allowed = isAllowed();
  const dispatch = useDispatch();
  const GroupFilterWrapper = useMemo(() => (!allowed || isDisabled ? Tooltip : ({ children }) => <Fragment>{children}</Fragment>), [
    allowed,
    isDisabled,
  ]);
  return (
    <Fragment>
      <Split hasGutter className="ins-c-chrome__global-filter">
        <SplitItem>
          {userLoaded && allowed !== undefined ? (
            <GroupFilterWrapper
              {...((!allowed || isDisabled) && {
                content: !allowed
                  ? 'You do not have the required inventory permissions to perform this action'
                  : 'Global filter is not applicable for this page',
                position: 'right',
              })}
            >
              <GroupFilter {...filter} isDisabled={!allowed || isDisabled} placeholder="Filter results" />
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
                  <ChipGroup key={key} categoryName={category} className={category === 'Workloads' ? 'ins-m-sticky' : ''}>
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
                  <Button variant="link" onClick={() => setValue(() => ({}))}>
                    Clear filters
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
  selectedTags: PropTypes.array,
  isOpen: PropTypes.bool,
  filterTagsBy: PropTypes.string,
  filterScope: PropTypes.string,
  setIsOpen: PropTypes.func.isRequired,
};

const GlobalFilter = () => {
  const [hasAccess, setHasAccess] = useState(undefined);

  const isAllowed = () => hasAccess;
  const history = useHistory();

  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState();
  const dispatch = useDispatch();
  const { isLoaded, count, total, sapCount, isDisabled } = useSelector(
    ({ globalFilter: { tags, sid, workloads, globalFilterHidden }, chrome: { appId } }) => ({
      isLoaded: tags.isLoaded && sid.isLoaded && workloads.isLoaded,
      count: tags.count + sid.count + workloads.count,
      total: tags.total + sid.total + workloads.total,
      sapCount: workloads.hasSap,
      isDisabled: globalFilterHidden || !appId,
    }),
    shallowEqual
  );
  const tags = useSelector(({ globalFilter: { tags } }) => tags.items || [], shallowEqual);
  const sid = useSelector(({ globalFilter: { sid } }) => sid.items || [], shallowEqual);
  const userLoaded = useSelector(({ chrome: { user } }) => Boolean(user));
  const filterScope = useSelector(({ globalFilter: { scope } }) => scope);

  const loadTags = (selectedTags, filterScope, filterTagsBy, token) => {
    storeFilter(selectedTags, token, isAllowed() && !isDisabled && userLoaded, history);
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
    } else if (userLoaded && token && isAllowed()) {
      loadTags(selectedTags, filterScope, filterTagsBy, token);
    }
  }, [selectedTags, filterScope, userLoaded, isAllowed()]);

  useEffect(() => {
    if (userLoaded && isAllowed()) {
      debouncedLoadTags(selectedTags, filterScope, filterTagsBy, token);
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
