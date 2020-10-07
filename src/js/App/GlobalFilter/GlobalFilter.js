import React, { useEffect, Fragment, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GroupFilter } from '@redhat-cloud-services/frontend-components/components/cjs/ConditionalFilter';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/components/cjs/FilterHooks';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/components/cjs/Skeleton';
import { fetchAllTags, globalFilterChange } from '../../redux/actions';
import { Split, SplitItem } from '@patternfly/react-core/dist/js/layouts/Split';
import { Chip, ChipGroup } from '@patternfly/react-core/dist/js/components/ChipGroup';
import { Button } from '@patternfly/react-core/dist/js/components/Button';
import TagsModal from './TagsModal';
import { workloads, updateSelected, storeFilter, generateFilter, selectWorkloads } from './constants';

const GlobalFilter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [token, setToken] = useState();
    const dispatch = useDispatch();
    const isLoaded = useSelector(({ chrome: { tags } }) => tags?.isLoaded);
    const tags = useSelector(({ chrome: { tags } }) => tags?.items || []);
    const count = useSelector(({ chrome: { tags } }) => tags?.count || 0);
    const total = useSelector(({ chrome: { tags } }) => tags?.total || 0);
    const userLoaded = useSelector(({ chrome: { user } }) => Boolean(user));
    const filterScope = useSelector(({ chrome: { globalFilterScope } }) => globalFilterScope || undefined);
    const { filter, chips, selectedTags, setValue, filterTagsBy } = useTagsFilter(
        [
            ...workloads,
            ...tags
        ],
        isLoaded && Boolean(token),
        total - count,
        (_e, closeFn) => {
            setIsOpen(() => true);
            closeFn && closeFn();
        },
        undefined,
        'system',
        'Manage tags'
    );
    useEffect(() => {
        if (!token && userLoaded) {
            (async () => {
                const [data, currToken] = await generateFilter();
                setValue(() => data);
                setToken(() => currToken);
            })();
        } else if (userLoaded && token) {
            storeFilter(selectedTags, token);
            dispatch(fetchAllTags({
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterTagsBy
            }));
        }
    }, [selectedTags, filterScope, filterTagsBy, userLoaded]);

    useEffect(() => {
        if (userLoaded && token) {
            if (!Object.values(selectedTags?.[workloads?.[0]?.name] || {})?.some(({ isSelected } = {}) => isSelected)) {
                setValue({
                    ...selectedTags || {},
                    [workloads?.[0]?.name || 'Workloads']: {
                        ...selectedTags?.[workloads?.[0]?.name],
                        ...selectWorkloads()
                    }
                });
            } else {
                dispatch(globalFilterChange(selectedTags));
            }
        }
    }, [selectedTags]);

    const workloadsChip = chips?.splice(chips?.findIndex(({ key }) => key === 'Workloads'), 1);
    chips?.splice(0, 0, ...workloadsChip || []);
    return <Fragment>
        <Split hasGutter className="ins-c-chrome__global-filter">
            <SplitItem>
                {userLoaded ?
                    <GroupFilter
                        {...filter}
                        placeholder="Search tags"
                    /> :
                    <Skeleton size={SkeletonSize.xl}/>
                }
            </SplitItem>
            <SplitItem isFilled>
                {chips?.length > 0 && (
                    <Fragment>
                        {chips.map(({ category, chips }, key) => (
                            <ChipGroup
                                key={key}
                                categoryName={category}
                                className={category === 'Workloads' ? 'ins-m-sticky' : ''}
                            >
                                {chips?.map(({ key: tagKey, value }, chipKey) => (
                                    <Chip
                                        key={chipKey}
                                        className={tagKey === 'All workloads' ? 'ins-m-permanent' : ''}
                                        onClick={() => setValue(() => updateSelected(
                                            selectedTags,
                                            category,
                                            tagKey,
                                            value,
                                            false
                                        ))}
                                    >
                                        {tagKey}
                                        {value ? `=${value}` : ''}
                                    </Chip>
                                ))}
                            </ChipGroup>
                        ))}
                        <Button variant="link" onClick={() => setValue(() => ({}))}>Clear filters</Button>
                    </Fragment>
                )}
            </SplitItem>
        </Split>
        {
            isOpen &&
            <TagsModal
                isOpen={isOpen}
                filterTagsBy={filterTagsBy}
                selectedTags={selectedTags}
                toggleModal={(isSubmit) => {
                    if (!isSubmit) {
                        dispatch(fetchAllTags({
                            registeredWith: filterScope,
                            activeTags: selectedTags,
                            search: filterTagsBy
                        }));
                    }
                    setIsOpen(false);
                }}
                onApplyTags={(selected) => {
                    setValue(() => selected.reduce((acc, { namespace, key, value }) => updateSelected(
                        acc,
                        namespace,
                        key,
                        value,
                        true
                    ), selectedTags));
                }} />
        }
    </Fragment>;
};

export default GlobalFilter;
