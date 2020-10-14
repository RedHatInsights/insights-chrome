import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { TagModal } from '@redhat-cloud-services/frontend-components/components/cjs/TagModal';
import { fetchAllTags } from '../../redux/actions';
import debounce from 'lodash/debounce';
import flatMap from 'lodash/flatMap';
import { getAllSIDs } from './tagsApi';

const TagsModal = ({ isOpen, filterTagsBy, onApplyTags, toggleModal, selectedTags }) => {
  const [tagsSelected, setTagsSelected] = useState([]);
  const [sidsSelected, setSidsSelected] = useState([]);
  const [filterBy, setFilterBy] = useState('');
  const dispatch = useDispatch();
  const { tagsLoaded, tagsCount, tagsPage, tagsPerPage } = useSelector(
    ({ globalFilter: { tags } }) => ({
      tagsLoaded: tags?.isLoaded,
      tagsCount: tags?.total || 0,
      tagsPage: tags?.page || 1,
      tagsPerPage: tags?.perPage || 10,
    }),
    shallowEqual
  );
  const { sidLoaded, sidCount, sidPage, sidPerPage } = useSelector(
    ({ globalFilter: { sid } }) => ({
      sidLoaded: sid?.isLoaded,
      sidCount: sid?.total || 0,
      sidPage: sid?.page || 1,
      sidPerPage: sid?.perPage || 10,
    }),
    shallowEqual
  );
  const tags = useSelector(({ globalFilter: { tags } }) => tags?.items || []);
  const sids = useSelector(({ globalFilter: { sid } }) => sid?.items || []);
  const filterScope = useSelector(({ globalFilter: { scope } }) => scope || undefined);
  const debounceGeTags = useCallback(
    debounce((search) => {
      dispatch(
        fetchAllTags(
          {
            registeredWith: filterScope,
            activeTags: selectedTags,
            search,
          },
          { tagsPage, tagsPerPage }
        )
      );
    }, 800),
    []
  );
  useEffect(() => {
    setFilterBy(filterTagsBy);
  }, [filterTagsBy]);
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
        toggleModal(isSubmit);
      }}
      filters={[
        [
          {
            label: 'Tags filter',
            placeholder: 'Filter tags',
            value: 'tags-filter',
            filterValues: {
              value: filterBy,
              onChange: (_e, value) => {
                setFilterBy(() => value);
                debounceGeTags(value);
              },
            },
          },
        ],
      ]}
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
            getAllSIDs(
              {
                registeredWith: filterScope,
                activeTags: selectedTags,
                search: filterBy,
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
