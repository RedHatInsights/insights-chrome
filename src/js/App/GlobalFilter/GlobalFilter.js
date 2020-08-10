import React, { useEffect, Fragment, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GroupFilter } from '@redhat-cloud-services/frontend-components/components/cjs/ConditionalFilter';
import { useTagsFilter } from '@redhat-cloud-services/frontend-components/components/cjs/FilterHooks';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/components/cjs/Skeleton';
import { fetchAllTags } from '../../redux/actions';
import { Split, SplitItem } from '@patternfly/react-core/dist/js/layouts/Split';
import { Chip, ChipGroup } from '@patternfly/react-core/dist/js/components/ChipGroup';
import { Button } from '@patternfly/react-core/dist/js/components/Button';
import TagsModal from './Tagsmodal';
import { workloads, updateSelected, storeFilter, GLOBAL_FILTER_KEY } from './constants';
import { decodeToken } from '../../jwt/jwt';

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
    const [filter, chips, selectedTags, setValue, filterTagsBy] = useTagsFilter(
        [
            ...workloads,
            ...tags
        ],
        isLoaded && Boolean(token),
        total - count,
        () => setIsOpen(() => true),
        undefined,
        'system',
        'Manage tags'
    );
    useEffect(() => {
        if (!token && userLoaded) {
            (async () => {
                const currToken = decodeToken(await insights.chrome.auth.getToken())?.jti;
                try {
                    setValue(() => JSON.parse(localStorage.getItem(`${GLOBAL_FILTER_KEY}/${currToken}`) || '{}'));
                } catch (e) {
                    setValue(() => {});
                }
                setToken(() => currToken);
            })();
        } else if (userLoaded) {
            storeFilter(selectedTags, token);
            dispatch(fetchAllTags({
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterTagsBy
            }));
        }
    }, [selectedTags, filterScope, filterTagsBy, userLoaded]);
    return <Fragment>
        <Split hasGutter className="ins-c-chrome__global-filter">
            <SplitItem>
                {userLoaded ?
                    <GroupFilter
                        {...filter}
                        placeholder="Filter by tags"
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
