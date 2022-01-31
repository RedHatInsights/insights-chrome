import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import useFilterConfig from '@redhat-cloud-services/frontend-components-utilities/useTableTools/useFilterConfig';
import { TagModal } from '@redhat-cloud-services/frontend-components/TagModal';
import { fetchAllTags, fetchAllSIDs } from '../../redux/actions';
import debounce from 'lodash/debounce';
import flatMap from 'lodash/flatMap';
import { tagsFilters, sidFilters } from './filters';

const useMetaSelector = (key) =>
  useSelector(
    ({ globalFilter: { [key]: selected } }) => [selected?.isLoaded, selected?.total || 0, selected?.page || 1, selected?.perPage || 10],
    shallowEqual
  );

const TagsModal = ({ isOpen, filterTagsBy, onApplyTags, toggleModal, selectedTags }) => {
  const [tagsSelected, setTagsSelected] = useState([]);
  const [sidsSelected, setSidsSelected] = useState([]);
  const {
    toolbarProps: tagsFilterToolbarProps,
    filterString,
    activeFilterValues,
  } = useFilterConfig({
    filters: {
      filterConfig: tagsFilters,
    },
  });
  const {
    toolbarProps: sidFilterToolbarProps,
    filterString: sidFS,
    activeFilterValues: sidAFV,
  } = useFilterConfig({
    filters: {
      filterConfig: sidFilters,
    },
  });
  console.log(tagsFilterToolbarProps, filterString, activeFilterValues);

  const [filterBy, setFilterBy] = useState('');
  const [filterSIDsBy, setFilterSIDsBy] = useState('');
  const dispatch = useDispatch();
  const [tagsLoaded, tagsCount, tagsPage, tagsPerPage] = useMetaSelector('tags');
  const [sidLoaded, sidCount, sidPage, sidPerPage] = useMetaSelector('sid');
  const tags = useSelector(({ globalFilter: { tags } }) => tags?.items || []);
  const sids = useSelector(({ globalFilter: { sid } }) => sid?.items || []);
  const filterScope = useSelector(({ globalFilter: { scope } }) => scope || undefined);
  const debounceGetTags = useCallback(
    debounce((search) => {
      dispatch(
        fetchAllTags(
          {
            registeredWith: filterScope,
            activeTags: selectedTags,
            search,
          },
          { page: tagsPage, perPage: tagsPerPage }
        )
      );
    }, 800),
    []
  );
  const debounceGetSIDs = useCallback(
    debounce((search) => {
      dispatch(
        fetchAllSIDs(
          {
            registeredWith: filterScope,
            activeTags: selectedTags,
            search,
          },
          { page: sidPage, perPage: sidPerPage }
        )
      );
    }, 800),
    []
  );
  useEffect(() => {
    setFilterBy(filterTagsBy);
    setFilterSIDsBy(filterTagsBy);
  }, [filterTagsBy]);

  useEffect(() => {
    console.log(tagsFilterToolbarProps);
  }, [activeFilterValues]);

  return (
    <TagModal
      tabNames={['tags', 'SAP IDs (SID)']}
      tableProps={{
        canSelectAll: false,
      }}
      pagination={[
        ...(tagsLoaded
          ? [
              {
                perPage: tagsPerPage,
                page: tagsPage,
                count: tagsCount,
              },
            ]
          : [{}]),
        ...(sidLoaded
          ? [
              {
                perPage: sidPerPage,
                page: sidPage,
                count: sidCount,
              },
            ]
          : [{}]),
      ]}
      rows={[
        ...(tagsLoaded
          ? [
              flatMap(tags, ({ tags }) =>
                tags?.map(({ tag: { key, value, namespace } } = { tag: {} }) => ({
                  id: `${namespace}/${key}=${value}`,
                  namespace,
                  key,
                  value,
                  selected: tagsSelected?.find?.(({ id } = {}) => id === `${namespace}/${key}=${value}`),
                  cells: [key, value, namespace],
                }))
              ),
            ]
          : [[]]),
        ...(sidLoaded
          ? [
              flatMap(sids, ({ tags }) =>
                tags?.map(({ tag: { key, namespace } } = { tag: {} }) => ({
                  namespace,
                  id: key,
                  key,
                  selected: sidsSelected?.find?.(({ id } = {}) => id === key),
                  cells: [key],
                }))
              ),
            ]
          : [[]]),
      ]}
      loaded={[tagsLoaded, sidLoaded]}
      width="50%"
      isOpen={isOpen}
      toggleModal={(_e, isSubmit) => {
        setSidsSelected([]);
        setTagsSelected([]);
        setFilterBy('');
        setFilterSIDsBy('');
        toggleModal(isSubmit);
      }}
      onUpdateData={[
        (pagination) =>
          dispatch(
            fetchAllTags(
              {
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterBy,
              },
              pagination
            )
          ),
        (pagination) =>
          dispatch(
            fetchAllSIDs(
              {
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterSIDsBy,
              },
              pagination
            )
          ),
      ]}
      columns={[[{ title: 'Name' }, { title: 'Value' }, { title: 'Tag sources' }], [{ title: 'Value' }]]}
      onSelect={[setTagsSelected, setSidsSelected]}
      selected={[tagsSelected, sidsSelected]}
      onApply={() => onApplyTags(tagsSelected, sidsSelected)}
      title="Select one or more tags/SAP IDs (SID)"
      ouiaId="global-filter-tags-modal"
      primaryToolbarProps={[{ ...tagsFilterToolbarProps }, { ...sidFilterToolbarProps }]}
    />
  );
};
TagsModal.propTypes = {
  isOpen: PropTypes.bool,
  selectedTags: PropTypes.object,
  filterTagsBy: PropTypes.string,
  onApplyTags: PropTypes.func,
  toggleModal: PropTypes.func,
};
TagsModal.defaultProps = {
  isOpen: false,
  selectedTags: {},
  onApplyTags: () => undefined,
  toggleModal: () => undefined,
};

export default TagsModal;
