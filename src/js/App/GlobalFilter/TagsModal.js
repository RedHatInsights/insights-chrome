import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { TagModal } from '@redhat-cloud-services/frontend-components/components/cjs/TagModal';
import { fetchAllTags } from '../../redux/actions';
import debounce from 'lodash/debounce';
import flatMap from 'lodash/flatMap';

const TagsModal = ({ isOpen, filterTagsBy, onApplyTags, toggleModal, selectedTags }) => {
  const [selected, setSelected] = useState([]);
  const [filterBy, setFilterBy] = useState('');
  const dispatch = useDispatch();
  const loaded = useSelector(({ globalFilter: { tags } }) => tags?.isLoaded);
  const tags = useSelector(({ globalFilter: { tags } }) => tags?.items || []);
  const tagsCount = useSelector(({ globalFilter: { tags } }) => tags?.total || 0);
  const page = useSelector(({ globalFilter: { tags } }) => tags?.page || 1);
  const perPage = useSelector(({ globalFilter: { tags } }) => tags?.perPage || 10);
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
          { page, perPage }
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
      tableProps={{
        canSelectAll: false,
      }}
      {...(loaded && {
        loaded,
        pagination: {
          perPage,
          page,
          count: tagsCount,
        },
        rows: flatMap(tags, ({ tags }) =>
          tags?.map(({ tag: { key, value, namespace } } = { tag: {} }) => ({
            id: `${namespace}/${key}=${value}`,
            namespace,
            key,
            value,
            selected: selected?.find?.(({ id } = {}) => id === `${namespace}/${key}=${value}`),
            cells: [key, value, namespace],
          }))
        ),
      })}
      loaded={loaded}
      width="50%"
      isOpen={isOpen}
      toggleModal={(_e, isSubmit) => {
        setSelected([]);
        setFilterBy('');
        toggleModal(isSubmit);
      }}
      filters={[
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
      ]}
      onUpdateData={(pagination) =>
        dispatch(
          fetchAllTags(
            {
              registeredWith: filterScope,
              activeTags: selectedTags,
              search: filterBy,
            },
            pagination
          )
        )
      }
      columns={[{ title: 'Name' }, { title: 'Value' }, { title: 'Tag sources' }]}
      onSelect={(selected) => setSelected(selected)}
      selected={selected}
      onApply={() => onApplyTags(selected)}
      title="All tags"
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
