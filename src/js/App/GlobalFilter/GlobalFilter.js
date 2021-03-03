import React, { useEffect, Fragment, useState, useCallback } from 'react';
import { useSelector, useDispatch, batch, shallowEqual } from 'react-redux';
import { GroupFilter } from '@redhat-cloud-services/frontend-components/components/cjs/ConditionalFilter';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/components/cjs/FilterHooks';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/components/cjs/Skeleton';
import { fetchAllSIDs, fetchAllTags, fetchAllWorkloads, globalFilterChange } from '../../redux/actions';
import { Split, SplitItem } from '@patternfly/react-core/dist/js/layouts/Split';
import { Chip, ChipGroup } from '@patternfly/react-core/dist/js/components/ChipGroup';
import { Button } from '@patternfly/react-core/dist/js/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/js/components/Tooltip';
import TagsModal from './TagsModal';
import { workloads, updateSelected, storeFilter, generateFilter } from './constants';
import debounce from 'lodash/debounce';
import { useHistory } from 'react-router-dom';

const GlobalFilter = () => {
  const [hasAccess, setHasAccess] = useState(undefined);

  const isAllowed = () => hasAccess;
  const history = useHistory();

  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState();
  const dispatch = useDispatch();
  const { isLoaded, count, total, sapCount, isDisabled } = useSelector(
    ({ globalFilter: { tags, sid, workloads, globalFilterHidden }, chrome: { appId } }) => ({
      isLoaded: tags?.isLoaded && sid?.isLoaded && workloads?.isLoaded,
      count: tags?.count || 0 + sid?.count || 0 + workloads?.count || 0,
      total: tags?.total || 0 + sid?.total || 0 + workloads?.total || 0,
      sapCount: workloads?.hasSap,
      isDisabled: globalFilterHidden || !appId,
    }),
    shallowEqual
  );
  const tags = useSelector(({ globalFilter: { tags } }) => tags?.items || []);
  const sid = useSelector(({ globalFilter: { sid } }) => sid?.items || []);
  const userLoaded = useSelector(({ chrome: { user } }) => Boolean(user));
  const filterScope = useSelector(({ globalFilter: { scope } }) => scope || undefined);
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
  const GroupFilterWrapper = !isAllowed() || isDisabled ? Tooltip : ({ children }) => <Fragment>{children}</Fragment>;
  return (
    <Fragment>
      <Split hasGutter className="ins-c-chrome__global-filter">
        <SplitItem>
          {userLoaded && isAllowed() !== undefined ? (
            <GroupFilterWrapper
              {...((!isAllowed() || isDisabled) && {
                content: !isAllowed()
                  ? 'You do not have the required inventory permissions to perform this action'
                  : 'Global filter is not applicable for this page',
                position: 'right',
              })}
            >
              <GroupFilter {...filter} isDisabled={!isAllowed() || isDisabled} placeholder="Filter results" />
            </GroupFilterWrapper>
          ) : (
            <Skeleton size={SkeletonSize.xl} />
          )}
        </SplitItem>
        {isAllowed() && (
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

export default GlobalFilter;
