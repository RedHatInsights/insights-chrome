import React, { useEffect, Fragment, useState } from 'react';
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
import { workloads, updateSelected, storeFilter, generateFilter, selectWorkloads } from './constants';

const GlobalFilter = () => {
  const [hasAccess, setHasAccess] = useState(undefined);

  const isAllowed = () => hasAccess;

  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState();
  const dispatch = useDispatch();
  const { isLoaded, count, total, sapCount } = useSelector(
    ({ globalFilter: { tags, sid, workloads } }) => ({
      isLoaded: tags?.isLoaded && sid?.isLoaded && workloads?.isLoaded,
      count: tags?.count || 0 + sid?.count || 0 + workloads?.count || 0,
      total: tags?.total || 0 + sid?.total || 0 + workloads?.total || 0,
      sapCount: workloads?.hasSap,
    }),
    shallowEqual
  );
  const tags = useSelector(({ globalFilter: { tags } }) => tags?.items || []);
  const sid = useSelector(({ globalFilter: { sid } }) => sid?.items || []);
  const userLoaded = useSelector(({ chrome: { user } }) => Boolean(user));
  const filterScope = useSelector(({ globalFilter: { scope } }) => scope || undefined);
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
      storeFilter(selectedTags, token);
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
    }
  }, [selectedTags, filterScope, filterTagsBy, userLoaded, isAllowed()]);

  useEffect(() => {
    if (userLoaded && token && isAllowed()) {
      if (!Object.values(selectedTags?.[workloads?.[0]?.name] || {})?.some(({ isSelected } = {}) => isSelected)) {
        setValue({
          ...(selectedTags || {}),
          [workloads?.[0]?.name || 'Workloads']: {
            ...selectedTags?.[workloads?.[0]?.name],
            ...selectWorkloads(),
          },
        });
      } else {
        dispatch(globalFilterChange(selectedTags));
      }
    }
  }, [selectedTags, isAllowed()]);

  useEffect(() => {
    const sapTag = workloads?.[0]?.tags?.[1];
    if (typeof sapCount === 'number' && sapTag) {
      sapTag.count = sapCount;
    }
  }, [sapCount]);

  const workloadsChip = chips?.splice(
    chips?.findIndex(({ key }) => key === 'Workloads'),
    1
  );
  chips?.splice(0, 0, ...(workloadsChip || []));
  const GroupFilterWrapper = isAllowed() ? Fragment : Tooltip;
  return (
    <Fragment>
      <Split hasGutter className="ins-c-chrome__global-filter">
        <SplitItem>
          {userLoaded && isAllowed() !== undefined ? (
            <GroupFilterWrapper position="right" content="You do not have the required inventory permissions to perform this action">
              <GroupFilter {...filter} isDisabled={!isAllowed()} placeholder="Search tags" />
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
                    {chips?.map(({ key: tagKey, value }, chipKey) => (
                      <Chip
                        key={chipKey}
                        className={tagKey === 'All workloads' ? 'ins-m-permanent' : ''}
                        onClick={() => setValue(() => updateSelected(selectedTags, category, tagKey, value, false))}
                      >
                        {tagKey}
                        {value ? `=${value}` : ''}
                      </Chip>
                    ))}
                  </ChipGroup>
                ))}
                <Button variant="link" onClick={() => setValue(() => ({}))}>
                  Clear filters
                </Button>
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
                (acc, { namespace, key, value }) => updateSelected(acc, namespace, key, value, true),
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
